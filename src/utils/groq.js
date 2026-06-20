// ── Groq API (FREE — console.groq.com) ───────────────────────────────────────
const GROQ_KEY = import.meta.env.VITE_GROQ_API_KEY || ''
const GROQ_URL = 'https://api.groq.com/openai/v1/chat/completions'
const MODEL    = 'llama-3.3-70b-versatile'

async function callGroq(systemPrompt, userPrompt, maxTokens = 1500) {
  if (!GROQ_KEY) throw new Error('VITE_GROQ_API_KEY not set in .env')
  const res = await fetch(GROQ_URL, {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
      'Authorization': `Bearer ${GROQ_KEY}`,
    },
    body: JSON.stringify({
      model: MODEL,
      max_tokens: maxTokens,
      temperature: 0.7,
      messages: [
        { role: 'system', content: systemPrompt },
        { role: 'user',   content: userPrompt   },
      ],
    }),
  })
  if (!res.ok) {
    const e = await res.json().catch(() => ({}))
    throw new Error(`Groq ${res.status}: ${e?.error?.message || 'API error'}`)
  }
  const data = await res.json()
  return data.choices[0].message.content.trim()
}

function safeJSON(text) {
  return JSON.parse(text.replace(/```json|```/g, '').trim())
}

// ── 1. Generate Interview Questions ──────────────────────────────────────────
export async function generateQuestions({ role, mode, difficulty, count, persona, companyPack, resumeText }) {
  const resumeCtx = resumeText
    ? `\nCandidate Resume (use this to ask personalized questions):\n${resumeText.slice(0, 1500)}`
    : ''

  const companyCtx = companyPack
    ? `\nFocus on questions commonly asked at ${companyPack}.` : ''

  const personaCtx = {
    'Friendly HR':   'You are a warm, encouraging interviewer. Keep the tone friendly.',
    'Strict':        'You are a tough, no-nonsense interviewer. Ask challenging follow-ups.',
    'Panel':         'Simulate a panel interview — prefix questions with [Interviewer 1], [Interviewer 2], [Interviewer 3].',
    'Professional':  'You are a professional, balanced interviewer.',
  }[persona] || ''

  const sys = `You are an expert interview coach. ${personaCtx} Always respond with valid JSON only — no markdown, no extra text.`

  const usr = `Generate exactly ${count} interview questions for a ${difficulty}-level ${role} candidate.
Interview type: ${mode}
${companyCtx}${resumeCtx}

Rules:
- Technical mode: coding, system design, problem-solving questions
- HR mode: personality, culture-fit, career goals
- Behavioral mode: STAR-method situational questions
- Mixed mode: blend of technical and HR
- Beginner: fundamentals and basics
- Intermediate: real-world application and problem solving
- Advanced: architecture, leadership, complex scenarios

Return ONLY a JSON array of question strings:
["Question 1?", "Question 2?", ...]`

  const text = await callGroq(sys, usr, 1200)
  return safeJSON(text)
}

// ── 2. Evaluate Answer + Feedback ────────────────────────────────────────────
export async function evaluateAnswer({ question, answer, role, difficulty, conversationHistory = [] }) {
  if (!answer || answer.trim().length < 4) {
    return { score: 0, communication: 0, technical: 0, confidence: 0, clarity: 0,
      summary: 'No answer provided.', strength: '', improvement: 'Please provide an answer next time.',
      needsFollowup: false, followupQuestion: '' }
  }

  const historyCtx = conversationHistory.length
    ? `\nPrevious conversation:\n${conversationHistory.map(h => `Q: ${h.q}\nA: ${h.a}`).join('\n')}`
    : ''

  const sys = `You are an experienced ${role} interviewer. Evaluate answers honestly and accurately. Return valid JSON only.`
  const usr = `Evaluate this ${difficulty}-level candidate's answer.
${historyCtx}
Question: ${question}
Answer: ${answer}

Return ONLY this JSON (no markdown):
{
  "score": <1-10>,
  "communication": <1-10>,
  "technical": <1-10>,
  "confidence": <1-10>,
  "clarity": <1-10>,
  "summary": "<2-3 sentence feedback>",
  "strength": "<what was good, 1 sentence>",
  "improvement": "<what to improve, 1 sentence>",
  "needsFollowup": <true if answer was incomplete/vague, false otherwise>,
  "followupQuestion": "<smart follow-up question if needsFollowup is true, else empty string>"
}`

  const text = await callGroq(sys, usr, 500)
  return safeJSON(text)
}

// ── 3. Final Report Summary ───────────────────────────────────────────────────
export async function generateFinalReport({ role, mode, difficulty, persona, avgScore, qas }) {
  const qaText = qas.map((qa, i) =>
    `Q${i+1}: ${qa.question}\nAnswer: ${qa.answer || '(skipped)'}\nScore: ${qa.score}/10`
  ).join('\n\n')

  const sys = `You are a senior ${role} hiring manager. Write concise, honest, actionable feedback. Return valid JSON only.`
  const usr = `This candidate just completed a ${difficulty} ${mode} interview for ${role}.
Average Score: ${avgScore}/10
Interview Persona: ${persona}

Q&A Summary:
${qaText}

Return ONLY this JSON:
{
  "headline": "<one punchy line about overall performance>",
  "overall": "<2-3 sentence overall assessment>",
  "strengths": ["<strength 1>", "<strength 2>", "<strength 3>"],
  "improvements": ["<improvement 1>", "<improvement 2>", "<improvement 3>"],
  "recommendation": "<Strong Hire / Hire / Maybe / No Hire>",
  "recommendationReason": "<1 sentence reason>",
  "studyTopics": ["<topic to study 1>", "<topic 2>", "<topic 3>"]
}`

  const text = await callGroq(sys, usr, 700)
  return safeJSON(text)
}

// ── 4. Daily Challenge Evaluation ────────────────────────────────────────────
export async function evaluateDailyChallenge({ question, answer, role }) {
  const sys = `You are a ${role} interview coach. Give brief, encouraging feedback. Return valid JSON only.`
  const usr = `Daily challenge answer evaluation.
Question: ${question}
Answer: ${answer}

Return ONLY this JSON:
{
  "score": <1-10>,
  "feedback": "<2 sentence encouraging feedback>",
  "tip": "<1 quick improvement tip>"
}`
  const text = await callGroq(sys, usr, 300)
  return safeJSON(text)
}