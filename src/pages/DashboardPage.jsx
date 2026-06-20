import React, { useEffect, useState } from 'react'
import { useNavigate } from 'react-router-dom'
import { supabase } from '../utils/supabase.js'
import { useAuth } from '../contexts/AuthContext.jsx'
import { evaluateDailyChallenge } from '../utils/gemini.js'
import { Zap, Flame, TrendingUp, Award, Crown, ChevronRight, Star, Calendar, MessageSquare } from 'lucide-react'
import { LineChart, Line, XAxis, YAxis, Tooltip, ResponsiveContainer, CartesianGrid } from 'recharts'
import './DashboardPage.css'

export default function DashboardPage() {
  const navigate = useNavigate()
  const { user, profile, refreshProfile } = useAuth()

  const [sessions, setSessions]     = useState([])
  const [challenge, setChallenge]   = useState(null)
  const [chalAnswer, setChalAnswer] = useState('')
  const [chalFeedback, setChalFeedback] = useState(null)
  const [chalLoading, setChalLoading]   = useState(false)
  const [chalDone, setChalDone]     = useState(false)
  const [loading, setLoading]       = useState(true)

  useEffect(() => {
    if (user) { fetchData() }
  }, [user])

  async function fetchData() {
    setLoading(true)
    // Fetch recent sessions
    const { data: s } = await supabase
      .from('interview_sessions')
      .select('id, role, mode, difficulty, overall_score, created_at, status')
      .eq('user_id', user.id)
      .eq('status', 'completed')
      .order('created_at', { ascending: false })
      .limit(10)
    setSessions(s || [])

    // Fetch today's challenge
    const today = new Date().toISOString().slice(0, 10)
    const { data: ch } = await supabase
      .from('daily_challenges')
      .select('*')
      .eq('challenge_date', today)
      .limit(1)
      .single()
    setChallenge(ch)

    // Check if already completed today
    if (ch) {
      const { data: done } = await supabase
        .from('challenge_completions')
        .select('id, score')
        .eq('user_id', user.id)
        .eq('challenge_id', ch.id)
        .single()
      if (done) { setChalDone(true); setChalFeedback({ score: done.score }) }
    }
    setLoading(false)
  }

  async function submitChallenge() {
    if (!chalAnswer.trim() || !challenge) return
    setChalLoading(true)
    try {
      const fb = await evaluateDailyChallenge({ question: challenge.question, answer: chalAnswer, role: profile?.role || 'Professional' })
      setChalFeedback(fb)

      await supabase.from('challenge_completions').upsert({
        user_id: user.id, challenge_id: challenge.id,
        answer: chalAnswer, score: fb.score,
        completed_at: new Date().toISOString()
      })
      setChalDone(true)
      await refreshProfile()
    } catch(e) { console.error(e) }
    setChalLoading(false)
  }

  // Build chart data
  const chartData = [...sessions].reverse().map((s, i) => ({
    name: `#${i+1}`, score: parseFloat(s.overall_score) || 0,
    role: s.role?.split(' ')[0]
  }))

  const avgScore = sessions.length
    ? (sessions.reduce((a, s) => a + (parseFloat(s.overall_score) || 0), 0) / sessions.length).toFixed(1)
    : '—'

  const FREE_LIMIT = 3
  const usedThisMonth = profile?.interviews_this_month || 0
  const canInterview  = profile?.is_premium || usedThisMonth < FREE_LIMIT

  if (loading) return <div className="full-loader"><div className="spinner-lg"/></div>

  return (
    <div className="page-wrap">
      {/* ── Header ── */}
      <div className="dash-header">
        <div>
          <h1 className="dash-title">Welcome back, {profile?.full_name?.split(' ')[0] || 'there'} 👋</h1>
          <p className="dash-sub">Ready for your next interview practice?</p>
        </div>
        <button className="btn btn-primary btn-lg" onClick={() => navigate('/setup')} disabled={!canInterview}>
          <Zap size={17}/> Start Interview
        </button>
      </div>

      {/* ── Free tier warning ── */}
      {!profile?.is_premium && usedThisMonth >= FREE_LIMIT && (
        <div className="upgrade-banner">
          <Crown size={18}/>
          <div>
            <strong>You've used all 3 free interviews this month.</strong>
            <span> Upgrade to Premium for unlimited access, voice mode, and PDF reports.</span>
          </div>
          <button className="btn btn-sm" style={{background:'#F59E0B',color:'#fff',flexShrink:0}} onClick={() => navigate('/pricing')}>
            Upgrade — ₹499/mo
          </button>
        </div>
      )}

      {/* ── Stats Row ── */}
      <div className="dash-stats">
        <div className="stat-card">
          <div className="stat-icon"><Award size={18}/></div>
          <div className="stat-num">{sessions.length}</div>
          <div className="stat-lbl">Total Sessions</div>
        </div>
        <div className="stat-card">
          <div className="stat-icon"><TrendingUp size={18}/></div>
          <div className="stat-num">{avgScore}</div>
          <div className="stat-lbl">Avg Score</div>
        </div>
        <div className="stat-card">
          <div className="stat-icon"><Flame size={18}/></div>
          <div className="stat-num">{profile?.streak_count || 0}</div>
          <div className="stat-lbl">Day Streak 🔥</div>
        </div>
        <div className="stat-card">
          <div className="stat-icon"><Calendar size={18}/></div>
          <div className="stat-num">{profile?.is_premium ? '∞' : `${FREE_LIMIT - usedThisMonth}`}</div>
          <div className="stat-lbl">{profile?.is_premium ? 'Unlimited' : 'Free Left'}</div>
        </div>
      </div>

      <div className="dash-grid">
        {/* ── Progress Chart ── */}
        <div className="card dash-chart-card">
          <h3 className="dash-card-title">Score Progress</h3>
          {chartData.length >= 2 ? (
            <ResponsiveContainer width="100%" height={180}>
              <LineChart data={chartData} margin={{top:5,right:10,left:-20,bottom:0}}>
                <CartesianGrid strokeDasharray="3 3" stroke="var(--border)" />
                <XAxis dataKey="name" tick={{fontSize:11, fill:'var(--text3)'}} />
                <YAxis domain={[0,10]} tick={{fontSize:11, fill:'var(--text3)'}} />
                <Tooltip contentStyle={{fontSize:12, borderRadius:8, border:'1px solid var(--border)'}} formatter={(v) => [`${v}/10`, 'Score']} />
                <Line type="monotone" dataKey="score" stroke="var(--primary)" strokeWidth={2.5} dot={{r:4, fill:'var(--primary)'}} activeDot={{r:6}}/>
              </LineChart>
            </ResponsiveContainer>
          ) : (
            <div className="empty-state" style={{padding:'2rem 0'}}>
              <TrendingUp size={32} style={{opacity:0.2, margin:'0 auto 10px', display:'block'}}/>
              <p>Complete 2+ interviews to see your progress chart.</p>
            </div>
          )}
        </div>

        {/* ── Daily Challenge ── */}
        <div className="card dash-challenge-card">
          <div className="challenge-header">
            <h3 className="dash-card-title"><Flame size={16} color="#F59E0B"/> Daily Challenge</h3>
            {chalDone && <span className="badge badge-green">Completed ✓</span>}
          </div>
          {challenge ? (
            <>
              <p className="challenge-q">{challenge.question}</p>
              {!chalDone ? (
                <>
                  <textarea
                    className="challenge-input"
                    placeholder="Type your answer here…"
                    value={chalAnswer}
                    onChange={e => setChalAnswer(e.target.value)}
                    rows={4}
                  />
                  <button className="btn btn-primary btn-full" onClick={submitChallenge} disabled={chalLoading || !chalAnswer.trim()}>
                    {chalLoading ? <><div className="spinner"/>Evaluating…</> : 'Submit Answer'}
                  </button>
                </>
              ) : chalFeedback && (
                <div className="chal-feedback">
                  <div className="chal-score"><Star size={14}/> {chalFeedback.score}/10</div>
                  {chalFeedback.feedback && <p>{chalFeedback.feedback}</p>}
                  {chalFeedback.tip && <p className="chal-tip">💡 {chalFeedback.tip}</p>}
                </div>
              )}
            </>
          ) : (
            <p style={{fontSize:13, color:'var(--text2)'}}>No challenge available today. Check back tomorrow!</p>
          )}
        </div>
      </div>

      {/* ── Recent Sessions ── */}
      <div className="card" style={{marginTop:'1rem'}}>
        <div style={{display:'flex', alignItems:'center', justifyContent:'space-between', marginBottom:'1rem'}}>
          <h3 className="dash-card-title">Recent Interviews</h3>
          <button className="btn btn-ghost btn-sm" onClick={() => navigate('/history')}>View All <ChevronRight size={14}/></button>
        </div>
        {sessions.length === 0 ? (
          <div className="empty-state" style={{padding:'1.5rem 0'}}>
            <MessageSquare size={32} style={{opacity:0.2, margin:'0 auto 10px', display:'block'}}/>
            <h3>No interviews yet</h3>
            <p>Start your first mock interview to see results here.</p>
          </div>
        ) : (
          <div className="recent-list">
            {sessions.slice(0, 5).map(s => (
              <div key={s.id} className="recent-item" onClick={() => navigate(`/results/${s.id}`)}>
                <div>
                  <div className="recent-role">{s.role}</div>
                  <div className="recent-meta">
                    <span className="badge badge-purple" style={{fontSize:11}}>{s.mode}</span>
                    <span className="badge badge-gray"   style={{fontSize:11}}>{s.difficulty}</span>
                    <span style={{fontSize:11, color:'var(--text3)'}}>{new Date(s.created_at).toLocaleDateString('en-IN', {day:'numeric', month:'short'})}</span>
                  </div>
                </div>
                <div className="recent-score" style={{color: parseFloat(s.overall_score) >= 7 ? 'var(--success)' : parseFloat(s.overall_score) >= 5 ? 'var(--primary)' : 'var(--warning)'}}>
                  {s.overall_score || '—'}
                </div>
              </div>
            ))}
          </div>
        )}
      </div>
    </div>
  )
}