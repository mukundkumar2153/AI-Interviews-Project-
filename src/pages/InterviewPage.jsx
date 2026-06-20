import React, { useState, useEffect, useRef } from 'react'
import { useNavigate } from 'react-router-dom'
import { supabase } from '../utils/supabase.js'
import { useAuth } from '../contexts/AuthContext.jsx'
import { generateQuestions, evaluateAnswer } from '../utils/groq.js'
import { Mic, MicOff, Volume2, SkipForward, ChevronRight, AlertCircle, Clock } from 'lucide-react'
import './InterviewPage.css'

export default function InterviewPage() {
  const navigate = useNavigate()
  const { user } = useAuth()

  const config = JSON.parse(sessionStorage.getItem('interview_config') || 'null')

  const [phase, setPhase]         = useState('loading') // loading | question | evaluating | feedback | done
  const [questions, setQuestions] = useState([])
  const [qIdx, setQIdx]           = useState(0)
  const [answer, setAnswer]       = useState('')
  const [feedback, setFeedback]   = useState(null)
  const [allQAs, setAllQAs]       = useState([])
  const [sessionId, setSessionId] = useState(null)
  const [loadMsg, setLoadMsg]     = useState('AI is generating your personalized interview…')
  const [error, setError]         = useState('')

  // Voice
  const [listening, setListening] = useState(false)
  const recognitionRef = useRef(null)
  const synthRef       = useRef(window.speechSynthesis)

  // Timer
  const [timer, setTimer]   = useState(120) // 2 min per question
  const timerRef            = useRef(null)

  // Follow-up state
  const [isFollowup, setIsFollowup]     = useState(false)
  const [followupQ, setFollowupQ]       = useState('')
  const [followupAnswer, setFollowupAnswer] = useState('')
  const [showFollowup, setShowFollowup] = useState(false)

  const textareaRef = useRef()

  useEffect(() => {
    if (!config || !user) { navigate('/setup'); return }
    initInterview()
    return () => {
      clearInterval(timerRef.current)
      synthRef.current?.cancel()
      recognitionRef.current?.stop()
    }
  }, [])

  useEffect(() => {
    if (phase === 'question') {
      setTimer(120)
      clearInterval(timerRef.current)
      timerRef.current = setInterval(() => {
        setTimer(t => { if (t <= 1) { clearInterval(timerRef.current); return 0 } return t - 1 })
      }, 1000)
      if (config.voiceMode && questions[qIdx]) speakQuestion(questions[qIdx])
      textareaRef.current?.focus()
    }
    return () => clearInterval(timerRef.current)
  }, [phase, qIdx])

  function speakQuestion(text) {
    synthRef.current?.cancel()
    const utt = new SpeechSynthesisUtterance(text)
    utt.rate = 0.9; utt.pitch = 1.0
    synthRef.current?.speak(utt)
  }

  function startListening() {
    const SpeechRecognition = window.SpeechRecognition || window.webkitSpeechRecognition
    if (!SpeechRecognition) { alert('Speech recognition not supported in this browser. Use Chrome.'); return }
    const rec = new SpeechRecognition()
    rec.lang = 'en-IN'; rec.continuous = true; rec.interimResults = true
    rec.onresult = e => {
      const transcript = Array.from(e.results).map(r => r[0].transcript).join('')
      if (isFollowup) setFollowupAnswer(transcript)
      else setAnswer(transcript)
    }
    rec.onend = () => setListening(false)
    rec.start()
    recognitionRef.current = rec
    setListening(true)
  }

  function stopListening() {
    recognitionRef.current?.stop()
    setListening(false)
  }

  async function initInterview() {
    setPhase('loading'); setLoadMsg('Creating your interview session…')
    // Create session in Supabase
    const { data: sess } = await supabase.from('interview_sessions').insert({
      user_id: user.id, role: config.role, mode: config.mode,
      difficulty: config.difficulty, persona: config.persona,
      company_pack: config.companyPack, voice_mode: config.voiceMode,
      question_count: config.count, status: 'in_progress'
    }).select().single()
    setSessionId(sess?.id)

    setLoadMsg('AI is generating your personalized questions…')
    try {
      const qs = await generateQuestions(config)
      setQuestions(qs)
      setPhase('question')
    } catch (e) {
      setError('Failed to generate questions. Check your Groq API key in the .env file.')
      setPhase('error')
    }
  }

  async function submitAnswer() {
    const ans = (isFollowup ? followupAnswer : answer).trim()
    if (ans.length < 3) return
    clearInterval(timerRef.current)
    synthRef.current?.cancel()
    stopListening()
    setPhase('evaluating')

    const history = allQAs.slice(-3).map(qa => ({ q: qa.question, a: qa.answer }))
    const fb = await evaluateAnswer({ question: isFollowup ? followupQ : questions[qIdx], answer: ans, role: config.role, difficulty: config.difficulty, conversationHistory: history })
    setFeedback(fb)

    // Save QA to Supabase
    if (sessionId) {
      await supabase.from('interview_qa').insert({
        session_id: sessionId, user_id: user.id,
        question_number: allQAs.length + 1,
        question: isFollowup ? followupQ : questions[qIdx],
        is_followup: isFollowup,
        user_answer: ans, score: fb.score,
        communication: fb.communication, technical: fb.technical,
        confidence: fb.confidence, clarity: fb.clarity,
        strength: fb.strength, improvement: fb.improvement,
        feedback_summary: fb.summary
      })
    }

    const qa = { question: isFollowup ? followupQ : questions[qIdx], answer: ans, feedback: fb, isFollowup }
    setAllQAs(prev => [...prev, qa])

    // Check if follow-up needed
    if (fb.needsFollowup && fb.followupQuestion && !isFollowup) {
      setShowFollowup(true)
      setFollowupQ(fb.followupQuestion)
    }
    setPhase('feedback')
  }

  function handleFollowup() {
    setIsFollowup(true)
    setShowFollowup(false)
    setAnswer('')
    setFollowupAnswer('')
    setFeedback(null)
    setPhase('question')
  }

  function goNext() {
    const nextIdx = qIdx + 1
    setIsFollowup(false); setFollowupQ(''); setFollowupAnswer('')
    setShowFollowup(false); setFeedback(null); setAnswer('')
    if (nextIdx >= questions.length) {
      finishInterview()
    } else {
      setQIdx(nextIdx)
      setPhase('question')
    }
  }

  async function finishInterview() {
    setPhase('loading'); setLoadMsg('Calculating your final score…')
    const scores = allQAs.map(q => q.feedback?.score || 0).filter(s => s > 0)
    const avg = scores.length ? (scores.reduce((a,b) => a+b,0) / scores.length).toFixed(1) : '0'

    const comm = avg2(allQAs, 'communication')
    const tech = avg2(allQAs, 'technical')
    const conf = avg2(allQAs, 'confidence')
    const clar = avg2(allQAs, 'clarity')

    if (sessionId) {
      await supabase.from('interview_sessions').update({
        overall_score: avg, communication_score: comm, technical_score: tech,
        confidence_score: conf, clarity_score: clar,
        status: 'completed', completed_at: new Date().toISOString()
      }).eq('id', sessionId)
    }
    navigate(`/results/${sessionId}`)
  }

  function avg2(qas, key) {
    const vals = qas.map(q => q.feedback?.[key] || 0).filter(v => v > 0)
    return vals.length ? Math.round(vals.reduce((a,b)=>a+b,0)/vals.length) : 0
  }

  async function skipQuestion() {
    const qa = { question: questions[qIdx], answer: '(Skipped)', feedback: { score:0, communication:0, technical:0, confidence:0, clarity:0, summary:'Question was skipped.', strength:'', improvement:'Always attempt every question.', needsFollowup:false }, isFollowup: false }
    setAllQAs(prev => [...prev, qa])
    const nextIdx = qIdx + 1
    setAnswer(''); setFeedback(null); setIsFollowup(false)
    if (nextIdx >= questions.length) finishInterview()
    else { setQIdx(nextIdx); setPhase('question') }
  }

  const progress = questions.length ? (qIdx / questions.length) * 100 : 0
  const timerColor = timer <= 30 ? 'var(--danger)' : timer <= 60 ? 'var(--warning)' : 'var(--text2)'
  const mins = Math.floor(timer/60), secs = timer % 60

  if (phase === 'loading') return (
    <div className="full-loader" style={{flexDirection:'column', gap:16}}>
      <div className="spinner-lg"/>
      <p style={{color:'var(--text2)', fontSize:15}}>{loadMsg}</p>
    </div>
  )

  if (phase === 'error') return (
    <div className="page-wrap-sm" style={{paddingTop:'3rem'}}>
      <div className="card card-lg" style={{textAlign:'center'}}>
        <AlertCircle size={44} color="var(--danger)" style={{margin:'0 auto 14px', display:'block'}}/>
        <h2 style={{marginBottom:8}}>Something went wrong</h2>
        <p style={{color:'var(--text2)', fontSize:14, marginBottom:'1.5rem'}}>{error}</p>
        <button className="btn btn-primary" onClick={() => navigate('/setup')}>Back to Setup</button>
      </div>
    </div>
  )

  const currentQ = isFollowup ? followupQ : questions[qIdx]

  return (
    <div className="page-wrap-sm">
      {/* Header */}
      <div className="iv-top">
        <div className="iv-badges">
          <span className="badge badge-purple">{config.role}</span>
          <span className="badge badge-purple">{config.mode}</span>
          <span className="badge badge-gray">{config.difficulty}</span>
          {isFollowup && <span className="badge badge-amber">Follow-up</span>}
        </div>
        <div className="iv-timer" style={{color: timerColor}}>
          <Clock size={14}/> {String(mins).padStart(2,'0')}:{String(secs).padStart(2,'0')}
        </div>
      </div>

      {/* Progress */}
      <div className="progress-wrap" style={{marginBottom:'1.5rem'}}>
        <div className="progress-fill" style={{width:`${progress}%`}}/>
      </div>

      {/* Question Card */}
      <div className="card iv-card">
        <div className="iv-q-label">
          {isFollowup ? 'Follow-up Question' : `Question ${qIdx + 1} of ${questions.length}`}
        </div>
        <p className="iv-question">{currentQ}</p>

        {/* Voice speak button */}
        {config.voiceMode && phase === 'question' && (
          <button className="btn btn-ghost btn-sm" style={{marginBottom:'0.75rem'}} onClick={() => speakQuestion(currentQ)}>
            <Volume2 size={14}/> Replay Question
          </button>
        )}

        {/* Answer area */}
        {(phase === 'question' || phase === 'feedback') && (
          <>
            {phase === 'question' && (
              <>
                <label className="field-label">Your Answer</label>
                <textarea
                  ref={textareaRef}
                  className="iv-textarea"
                  placeholder="Type your answer here… Be as detailed as possible for better AI feedback. (Ctrl+Enter to submit)"
                  value={isFollowup ? followupAnswer : answer}
                  onChange={e => isFollowup ? setFollowupAnswer(e.target.value) : setAnswer(e.target.value)}
                  onKeyDown={e => { if (e.ctrlKey && e.key === 'Enter') submitAnswer() }}
                  rows={6}
                />
                <div className="iv-actions">
                  {/* Voice toggle */}
                  {config.voiceMode && (
                    <button className={`btn ${listening ? 'btn-danger' : 'btn-outline'} btn-sm`} onClick={listening ? stopListening : startListening}>
                      {listening ? <><MicOff size={14}/> Stop</> : <><Mic size={14}/> Speak</>}
                    </button>
                  )}
                  <button className="btn btn-ghost btn-sm" onClick={skipQuestion}><SkipForward size={14}/> Skip</button>
                  <button className="btn btn-primary" style={{flex:1}} onClick={submitAnswer} disabled={!(isFollowup ? followupAnswer : answer).trim()}>
                    {qIdx === questions.length - 1 && !isFollowup ? 'Submit & Finish' : 'Submit & Next'}
                    <ChevronRight size={15}/>
                  </button>
                </div>
                <p className="iv-hint">Tip: Press Ctrl+Enter to submit</p>
              </>
            )}

            {phase === 'feedback' && feedback && (
              <div className="iv-feedback">
                {/* Score */}
                <div className="fb-score-row">
                  <div className="fb-big-score" style={{color: feedback.score >= 7 ? 'var(--success)' : feedback.score >= 5 ? 'var(--primary)' : 'var(--danger)'}}>
                    {feedback.score}<span>/10</span>
                  </div>
                  <div className="fb-metrics">
                    <MetricBadge label="Communication" val={feedback.communication}/>
                    <MetricBadge label="Technical"     val={feedback.technical}/>
                    <MetricBadge label="Confidence"    val={feedback.confidence}/>
                    <MetricBadge label="Clarity"       val={feedback.clarity}/>
                  </div>
                </div>

                {/* Feedback text */}
                <div className="fb-box">
                  {feedback.strength && <div className="fb-row good">✓ <span><strong>Strength:</strong> {feedback.strength}</span></div>}
                  {feedback.improvement && <div className="fb-row improve">→ <span><strong>Improve:</strong> {feedback.improvement}</span></div>}
                  <p className="fb-summary">{feedback.summary}</p>
                </div>

                {/* Follow-up prompt */}
                {showFollowup && (
                  <div className="followup-prompt">
                    <p className="followup-label">🎯 The AI wants to dig deeper:</p>
                    <p className="followup-q">"{followupQ}"</p>
                    <div style={{display:'flex', gap:8, marginTop:10}}>
                      <button className="btn btn-outline btn-sm" onClick={goNext}>Skip Follow-up</button>
                      <button className="btn btn-primary btn-sm" onClick={handleFollowup}>Answer Follow-up</button>
                    </div>
                  </div>
                )}

                {/* Next button (only if no pending follow-up) */}
                {!showFollowup && (
                  <button className="btn btn-primary btn-full" onClick={goNext} style={{marginTop:'1rem'}}>
                    {qIdx === questions.length - 1 ? '🎉 View Final Report' : 'Next Question →'}
                  </button>
                )}
              </div>
            )}
          </>
        )}

        {phase === 'evaluating' && (
          <div className="loading-row" style={{padding:'1.5rem 0', justifyContent:'center'}}>
            <div className="spinner"/> AI is evaluating your answer…
          </div>
        )}
      </div>

      {/* Mini progress dots */}
      {allQAs.length > 0 && (
        <div className="iv-dots">
          {allQAs.map((qa, i) => (
            <div key={i} title={`Q${i+1}: ${qa.feedback?.score || 0}/10`}
              className={`iv-dot ${(qa.feedback?.score||0) >= 7 ? 'good' : (qa.feedback?.score||0) >= 5 ? 'ok' : (qa.feedback?.score||0) > 0 ? 'low' : 'skip'}`}
            />
          ))}
          <div className="iv-dot current"/>
        </div>
      )}
    </div>
  )
}

function MetricBadge({ label, val }) {
  const cls = val >= 7 ? 'badge-green' : val >= 5 ? 'badge-purple' : 'badge-amber'
  return <span className={`badge ${cls}`} style={{fontSize:11}}>{label}: {val}/10</span>
}