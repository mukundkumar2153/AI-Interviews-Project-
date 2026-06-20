import React, { useState } from 'react'
import { useNavigate } from 'react-router-dom'
import { useAuth } from '../contexts/AuthContext.jsx'
import { Code2, BarChart2, Megaphone, Users, Banknote, Building2, Landmark, Shield, Cpu, Heart, Brain, Shuffle, Mic2, MicOff, ChevronRight, Crown } from 'lucide-react'
import './SetupPage.css'

const ROLES = [
  { id: 'Software Developer', icon: <Code2 size={20}/>, desc: 'DSA, System Design, Coding' },
  { id: 'Data Analyst',       icon: <BarChart2 size={20}/>, desc: 'SQL, Python, Statistics' },
  { id: 'Marketing Manager',  icon: <Megaphone size={20}/>, desc: 'Strategy, Campaigns' },
  { id: 'HR Manager',         icon: <Users size={20}/>, desc: 'Recruitment, Culture' },
  { id: 'Sales Executive',    icon: <Banknote size={20}/>, desc: 'Targets, Negotiation' },
  { id: 'Finance Analyst',    icon: <Building2 size={20}/>, desc: 'Accounting, Finance' },
  { id: 'Banking Professional', icon: <Landmark size={20}/>, desc: 'Banking, Compliance' },
  { id: 'Government/PSU',     icon: <Shield size={20}/>, desc: 'UPSC, SSC, PSU' },
]
const MODES      = [
  { id: 'Technical',  icon: <Cpu size={15}/>,   desc: 'Core skills & problem solving' },
  { id: 'HR',         icon: <Heart size={15}/>,  desc: 'Soft skills & culture fit' },
  { id: 'Behavioral', icon: <Brain size={15}/>,  desc: 'STAR-method situations' },
  { id: 'Mixed',      icon: <Shuffle size={15}/>, desc: 'Technical + HR blend' },
]
const LEVELS     = ['Beginner', 'Intermediate', 'Advanced']
const COUNTS     = [5, 8, 10]
const PERSONAS   = ['Professional', 'Friendly HR', 'Strict', 'Panel']
const COMPANIES  = ['None', 'Amazon', 'Google', 'TCS', 'Infosys', 'Wipro', 'Flipkart', 'Zomato', 'Paytm', 'HDFC Bank']

export default function SetupPage() {
  const navigate = useNavigate()
  const { profile } = useAuth()

  const [role,     setRole]     = useState(profile?.role || 'Software Developer')
  const [mode,     setMode]     = useState('Mixed')
  const [level,    setLevel]    = useState(profile?.experience_level || 'Intermediate')
  const [count,    setCount]    = useState(8)
  const [persona,  setPersona]  = useState('Professional')
  const [company,  setCompany]  = useState('None')
  const [voice,    setVoice]    = useState(false)
  const [error,    setError]    = useState('')

  function handleStart() {
    if (!role) { setError('Please select a role to continue.'); return }
    // Store config in sessionStorage for InterviewPage
    sessionStorage.setItem('interview_config', JSON.stringify({
      role, mode, difficulty: level, count, persona,
      companyPack: company === 'None' ? null : company,
      voiceMode: voice,
      resumeText: profile?.resume_text || ''
    }))
    navigate('/interview')
  }

  return (
    <div className="page-wrap">
      <div className="setup-hdr">
        <h1>Interview Setup</h1>
        <p>Customize your mock interview session.</p>
      </div>

      {/* Role */}
      <div className="card setup-card">
        <label className="field-label">Job Role *</label>
        <div className="role-grid">
          {ROLES.map(r => (
            <button key={r.id} className={`role-btn ${role === r.id ? 'selected' : ''}`} onClick={() => setRole(r.id)}>
              <div className="role-btn-icon">{r.icon}</div>
              <div className="role-btn-name">{r.id}</div>
              <div className="role-btn-desc">{r.desc}</div>
            </button>
          ))}
        </div>
      </div>

      {/* Mode */}
      <div className="card setup-card">
        <label className="field-label">Interview Type</label>
        <div className="mode-grid">
          {MODES.map(m => (
            <button key={m.id} className={`mode-btn ${mode === m.id ? 'selected' : ''}`} onClick={() => setMode(m.id)}>
              <span className="mode-icon">{m.icon}</span>
              <span className="mode-name">{m.id}</span>
              <span className="mode-desc">{m.desc}</span>
            </button>
          ))}
        </div>
      </div>

      {/* Level + Count */}
      <div className="card setup-card">
        <div className="two-col">
          <div>
            <label className="field-label">Difficulty Level</label>
            <div className="pill-row">
              {LEVELS.map(l => <button key={l} className={`pill ${level === l ? 'selected' : ''}`} onClick={() => setLevel(l)}>{l}</button>)}
            </div>
          </div>
          <div>
            <label className="field-label">Number of Questions</label>
            <div className="pill-row">
              {COUNTS.map(c => <button key={c} className={`pill ${count === c ? 'selected' : ''}`} onClick={() => setCount(c)}>{c} Qs</button>)}
            </div>
          </div>
        </div>
      </div>

      {/* Persona + Company */}
      <div className="card setup-card">
        <div className="two-col">
          <div>
            <label className="field-label">AI Interviewer Persona</label>
            <div className="pill-row" style={{flexWrap:'wrap'}}>
              {PERSONAS.map(p => <button key={p} className={`pill ${persona === p ? 'selected' : ''}`} onClick={() => setPersona(p)}>{p}</button>)}
            </div>
          </div>
          <div>
            <label className="field-label">Company-Specific Pack</label>
            <select value={company} onChange={e => setCompany(e.target.value)}>
              {COMPANIES.map(c => <option key={c} value={c}>{c === 'None' ? 'General (No pack)' : `${c} Interview Questions`}</option>)}
            </select>
          </div>
        </div>
      </div>

      {/* Voice Mode */}
      <div className="card setup-card voice-card">
        <div className="voice-row">
          <div className="voice-info">
            <div className="voice-title"><Mic2 size={17} color="var(--primary)"/> Voice Interview Mode</div>
            <div className="voice-desc">AI speaks questions aloud (Text-to-Speech). You answer with your voice (Speech-to-Text). Feels like a real interview. <span className="badge badge-amber" style={{fontSize:11}}><Crown size={10}/> Premium</span></div>
          </div>
          <button
            className={`voice-toggle ${voice ? 'on' : ''}`}
            onClick={() => setVoice(!voice)}
            title={voice ? 'Turn off voice mode' : 'Turn on voice mode'}
          >
            {voice ? <Mic2 size={18}/> : <MicOff size={18}/>}
            <span>{voice ? 'ON' : 'OFF'}</span>
          </button>
        </div>
        {profile?.resume_text && <p className="resume-notice">✓ Resume uploaded — AI will ask personalized questions from your CV.</p>}
      </div>

      {/* Summary + Start */}
      <div className="setup-footer">
        {error && <p className="error-msg">{error}</p>}
        <div className="setup-summary">
          <span className="badge badge-purple">{role}</span>
          <span className="badge badge-purple">{mode}</span>
          <span className="badge badge-purple">{level}</span>
          <span className="badge badge-purple">{count} Questions</span>
          <span className="badge badge-purple">{persona}</span>
          {company !== 'None' && <span className="badge badge-blue">{company}</span>}
          {voice && <span className="badge badge-green"><Mic2 size={11}/> Voice</span>}
        </div>
        <button className="btn btn-primary btn-lg btn-full" onClick={handleStart} disabled={!role}>
          Generate Interview <ChevronRight size={18}/>
        </button>
      </div>
    </div>
  )
}