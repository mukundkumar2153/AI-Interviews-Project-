# InterviewAI 🎯

**AI-Powered Mock Interview Platform** — practice interviews with real-time AI feedback, powered by the free Groq API and Supabase.

---

## 📌 Overview

InterviewAI is a web app that simulates real interview scenarios. Users pick a role, mode, and difficulty level (optionally uploading a resume), go through a live Q&A session with AI-generated questions and feedback, and get a detailed score report at the end. Past sessions are tracked so users can see their progress over time.

---

## ✨ Features

- 🧑‍💼 **Custom Setup** — choose role, interview mode, and difficulty level; upload a resume for more relevant questions
- 💬 **Live AI Interview** — real-time Q&A with instant AI feedback during the session
- 📊 **Results & Report** — get a score breakdown at the end, downloadable as a report
- 📈 **History Tracking** — review past interviews and track improvement over time
- ⚡ **Fast & Free AI** — powered by Groq's free-tier API running Llama 3.3 70B

---

## 🛠️ Tech Stack

- **Frontend:** React + Vite
- **Styling:** CSS
- **AI:** Groq API (Llama 3.3 70B)
- **Database:** Supabase (PostgreSQL, via `Supabase.sql`)
- **Storage (client-side):** localStorage for interview data caching

---

## 📁 Project Structure

```
interview-ai/
├── src/
│   ├── pages/
│   │   ├── LandingPage.jsx     ← Home page
│   │   ├── SetupPage.jsx       ← Role/mode/level + resume upload
│   │   ├── InterviewPage.jsx   ← Live Q&A + AI feedback
│   │   ├── ResultsPage.jsx     ← Score + report + download
│   │   └── HistoryPage.jsx     ← Progress tracking
│   ├── utils/
│   │   ├── claude.js           ← Groq API calls
│   │   └── storage.js          ← localStorage helpers
│   └── index.css               ← Global styles
├── Supabase.sql                ← Database schema
├── index.html
├── vite.config.js
├── .env                        ← Your API key (not committed to git)
└── package.json
```

---

## ⚡ Setup Guide

### Step 1 — Get a Free Groq API Key

1. Go to [console.groq.com](https://console.groq.com)
2. Sign up with Google/GitHub
3. Navigate to **API Keys** → **Create API Key** → copy it
4. Completely free — no credit card required

### Step 2 — Clone & Install

```bash
git clone https://github.com/mukundkumar2153/AI-Interviews-Project-.git
cd AI-Interviews-Project-
npm install
```

### Step 3 — Set Up Environment Variables

Create a `.env` file in the project root:

```
VITE_GROQ_API_KEY=YOUR_KEY_HERE
```

### Step 4 — Set Up Supabase

1. Create a free project at [supabase.com](https://supabase.com)
2. Run the schema from `Supabase.sql` in the Supabase SQL editor
3. Add your Supabase project URL and anon key to `.env`:

```
VITE_SUPABASE_URL=YOUR_SUPABASE_URL
VITE_SUPABASE_ANON_KEY=YOUR_SUPABASE_ANON_KEY
```

### Step 5 — Run the Project

```bash
npm run dev
```

App runs at: `http://localhost:5173`

---

## 🆓 Groq Free Tier Limits

- 14,400 requests/day
- Model: Llama 3.3 70B
- Very fast response times
- Cost: ₹0

---

## 🔗 Live Project

👉 [https://ai-interviews-project-three.vercel.app/](https://ai-interviews-project-three.vercel.app/)
