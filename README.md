# InterviewAI 🎯
AI-Powered Mock Interview Platform — Groq API (FREE)

---

## ⚡ Setup in 4 Steps

### Step 1 — Groq Free API Key Lo
1. **console.groq.com** jao
2. Google/GitHub se signup karo
3. **"API Keys"** → **"Create API Key"** → Copy karo
4. Bilkul FREE — koi credit card nahi

### Step 2 — Project Install Karo
```bash
cd interview-ai
npm install
```

### Step 3 — .env File Banao
`.env.example` copy karke `.env` naam do:
```bash
# Windows:
copy .env.example .env

# Mac/Linux:
cp .env.example .env
```
Phir `.env` file mein apni key paste karo:
```
VITE_GROQ_API_KEY=gsk_TUMHARI_KEY_YAHAN
```

### Step 4 — Run Karo
```bash
npm run dev
```
Browser mein khulega: **http://localhost:5173**

---

## 🆓 Groq Free Tier
- **14,400 requests/day** — bohot zyada hai
- **Model**: Llama 3.3 70B (excellent quality)
- **Speed**: Bahut fast responses
- **Cost**: Zero ₹

---

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
├── .env                      ← Tumhari key (git mein mat daalo!)
└── package.json
```
