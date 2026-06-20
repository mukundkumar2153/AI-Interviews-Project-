const GEMINI_API_KEY = import.meta.env.VITE_GEMINI_API_KEY
const GEMINI_MODEL = 'gemini-2.0-flash'
const BASE_URL = `https://generativelanguage.googleapis.com/v1beta/models/${GEMINI_MODEL}:generateContent?key=${GEMINI_API_KEY}`

async function callGemini(prompt) {
  const res = await fetch(BASE_URL, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({
      contents: [{ parts: [{ text: prompt }] }],
      generationConfig: {
        temperature: 0.8,
        responseMimeType: 'application/json'
      }
    })
  })

  if (!res.ok) {
    const errText = await res.text()
    throw new Error(`Gemini API error: ${res.status} ${errText}`)
  }

  const data = await res.json()
  const text = data?.candidates?.[0]?.content?.parts?.[0]?.text
  if (!text) throw new Error('Empty response from Gemini')

  // Strip accidental markdown fences just in case
  const cleaned = text.replace(/```json|```/g, '').trim()
  return JSON.parse(cleaned)
}

// ── 1. Generate interview questions ──────────────────────────────
export async function generateQuestions(config) {
  const { role, mode, difficulty, count, persona, companyPack, resumeText } = config

  let prompt = `You are an expert interview question generator for the Indian job market.
Generate exactly ${count} interview questions for a "${role}" position.
Interview type: ${mode} (Technical / HR / Behavioral / Mixed)
Difficulty: ${difficulty}
Interviewer persona style: ${persona}`

  if (companyPack) prompt += `\nThese questions should be in the style of ${companyPack}'s actual interview process.`
  if (resumeText) prompt += `\nThe candidate's resume content is below — ask at least 2-3 questions directly referencing their actual skills/projects:\n"""${resumeText.slice(0, 2000)}"""`

  prompt += `\n\nRespond ONLY with valid JSON in this exact format, no markdown, no explanation:
{"questions": ["question 1", "question 2", ...]}`

  const result = await callGemini(prompt)
  return result.questions || []
}

// ── 2. Evaluate a single answer ───────────────────────────────────
export async function evaluateAnswer({ question, answer, role, difficulty, conversationHistory }) {
  let prompt = `You are an expert interview evaluator for a "${role}" position at "${difficulty}" difficulty level.

Question: "${question}"
Candidate's Answer: "${answer}"`

  if (conversationHistory?.length) {
    prompt += `\n\nPrevious Q&A in this interview for context:\n`
    conversationHistory.forEach(h => { prompt += `Q: ${h.q}\nA: ${h.a}\n` })
  }

  prompt += `\n\nEvaluate the answer and respond ONLY with valid JSON in this exact format, no markdown:
{
  "score": <integer 0-10>,
  "communication": <integer 0-10>,
  "technical": <integer 0-10>,
  "confidence": <integer 0-10>,
  "clarity": <integer 0-10>,
  "strength": "<one short sentence on what was good>",
  "improvement": "<one short sentence on what to improve>",
  "summary": "<2-3 sentence overall feedback>",
  "needsFollowup": <true if the answer was incomplete/vague and deserves a deeper follow-up question, else false>,
  "followupQuestion": "<a smart follow-up question if needsFollowup is true, else empty string>"
}`

  return callGemini(prompt)
}

// ── 3. Evaluate daily challenge answer ────────────────────────────
export async function evaluateDailyChallenge({ question, answer, role }) {
  const prompt = `You are an interview coach. Evaluate this quick daily practice answer for a "${role}" candidate.

Question: "${question}"
Answer: "${answer}"

Respond ONLY with valid JSON in this exact format, no markdown:
{
  "score": <integer 0-10>,
  "feedback": "<2 sentence feedback>",
  "tip": "<one short actionable tip>"
}`

  return callGemini(prompt)
}