# InterviewAI 🎯
**AI-Powered Mock Interview Platform — Groq API (FREE)**

## ⚡ Setup in 4 Steps

### Step 1 — Get Your Free Groq API Key

1. Go to console.groq.com
2. Sign up using Google/GitHub
3. "API Keys" → "Create API Key" → Copy it
4. Completely FREE — no credit card required

### Step 2 — Install the Project

```
cd interview-ai
npm install
```

### Step 3 — Create the .env File
Copy `.env.example` and rename it to `.env`:

```
# Windows:
copy .env.example .env

# Mac/Linux:
cp .env.example .env
```

Then paste your key into the `.env` file:

```
VITE_GROQ_API_KEY=YOUR_KEY_HERE

```

### Step 4 — Run the Project

```
npm run dev
```

It will open in your browser at: http://localhost:5173

## 🆓 Groq Free Tier

* 14,400 requests/day — more than enough
* Model: Llama 3.3 70B (excellent quality)
* Speed: Very fast responses
* Cost: Zero ₹

## 📁 Project Structure

```
interview-ai/
├── src/
│   ├── pages/
│   │   ├── LandingPage.jsx   ← Home page
│   │   ├── SetupPage.jsx     ← Role/mode/level + resume upload
│   │   ├── InterviewPage.jsx ← Q&A + live AI feedback
│   │   ├── ResultsPage.jsx   ← Score + report + download
│   │   └── HistoryPage.jsx   ← Progress tracking
│   ├── utils/
│   │   ├── claude.js         ← Groq API calls
│   │   └── storage.js        ← localStorage
│   └── index.css             ← Global styles
├── .env                      ← Your key (don't commit to git!)
└── package.json
```
