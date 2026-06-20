import React, { useState } from 'react'
import { useNavigate } from 'react-router-dom'
import { supabase } from '../utils/supabase.js'
import { useAuth } from '../contexts/AuthContext.jsx'
import { Code2, BarChart2, Megaphone, Users, Banknote, Building2, Landmark, Shield, ChevronRight, Upload, X, FileText } from 'lucide-react'
import './OnboardingPage.css'

const ROLES = [
  { id: 'Software Developer', icon: <Code2 size={22}/>,   desc: 'DSA, System Design, Coding' },
  { id: 'Data Analyst',       icon: <BarChart2 size={22}/>, desc: 'SQL, Python, Statistics' },
  { id: 'Marketing Manager',  icon: <Megaphone size={22}/>, desc: 'Strategy, Digital, Campaigns' },
  { id: 'HR Manager',         icon: <Users size={22}/>,    desc: 'Recruitment, Culture, Policy' },
  { id: 'Sales Executive',    icon: <Banknote size={22}/>, desc: 'Targets, Negotiation, CRM' },
  { id: 'Finance Analyst',    icon: <Building2 size={22}/>, desc: 'Accounting, Reporting' },
  { id: 'Banking Professional', icon: <Landmark size={22}/>, desc: 'Finance, Compliance, Banking' },
  { id: 'Government/PSU',     icon: <Shield size={22}/>,   desc: 'UPSC, SSC, PSU Exams' },
]
const LEVELS = ['Fresher', 'Mid-Level', 'Senior']

export default function OnboardingPage() {
  const navigate = useNavigate()
  const { user, refreshProfile } = useAuth()
  const [step, setStep]       = useState(1)
  const [role, setRole]       = useState('')
  const [level, setLevel]     = useState('')
  const [resume, setResume]   = useState(null)
  const [resumeText, setResumeText] = useState('')
  const [loading, setLoading] = useState(false)
  const fileRef               = React.useRef()

  function handleFile(e) {
    const f = e.target.files[0]
    if (!f) return
    setResume(f)
    const reader = new FileReader()
    reader.onload = ev => setResumeText(ev.target.result)
    reader.readAsText(f)
  }

  async function finish() {
    setLoading(true)
    await supabase.from('user_profiles').update({
      role, experience_level: level,
      resume_text: resumeText || null,
      resume_filename: resume?.name || null,
      updated_at: new Date().toISOString()
    }).eq('id', user.id)
    await refreshProfile()
    navigate('/dashboard')
  }

  return (
    <div className="onb-page">
      <div className="onb-card card card-lg">
        {/* Step indicator */}
        <div className="onb-steps">
          {[1,2,3].map(s => (
            <div key={s} className={`onb-step ${step >= s ? 'done' : ''} ${step === s ? 'active' : ''}`}>
              <div className="onb-step-dot">{s}</div>
              <span>{s === 1 ? 'Your Role' : s === 2 ? 'Experience' : 'Resume'}</span>
            </div>
          ))}
        </div>

        {/* Step 1 — Role */}
        {step === 1 && (
          <>
            <h2 className="onb-title">What is your job field?</h2>
            <p className="onb-sub">We'll generate questions tailored to your role.</p>
            <div className="onb-role-grid">
              {ROLES.map(r => (
                <button key={r.id} className={`onb-role-btn ${role === r.id ? 'selected' : ''}`} onClick={() => setRole(r.id)}>
                  <div className="onb-role-icon">{r.icon}</div>
                  <div className="onb-role-label">{r.id}</div>
                  <div className="onb-role-desc">{r.desc}</div>
                </button>
              ))}
            </div>
            <button className="btn btn-primary btn-full btn-lg" disabled={!role} onClick={() => setStep(2)}>
              Continue <ChevronRight size={17}/>
            </button>
          </>
        )}

        {/* Step 2 — Level */}
        {step === 2 && (
          <>
            <h2 className="onb-title">What is your experience level?</h2>
            <p className="onb-sub">This helps us set the right difficulty for your questions.</p>
            <div className="onb-level-grid">
              {LEVELS.map(l => (
                <button key={l} className={`onb-level-btn ${level === l ? 'selected' : ''}`} onClick={() => setLevel(l)}>
                  <div className="onb-level-name">{l}</div>
                  <div className="onb-level-desc">{
                    l === 'Fresher' ? '0–1 year · Students & fresh graduates' :
                    l === 'Mid-Level' ? '2–5 years · Working professionals' :
                    '5+ years · Team leads & managers'
                  }</div>
                </button>
              ))}
            </div>
            <div style={{display:'flex', gap:10}}>
              <button className="btn btn-outline" onClick={() => setStep(1)}>Back</button>
              <button className="btn btn-primary btn-full btn-lg" disabled={!level} onClick={() => setStep(3)}>
                Continue <ChevronRight size={17}/>
              </button>
            </div>
          </>
        )}

        {/* Step 3 — Resume */}
        {step === 3 && (
          <>
            <h2 className="onb-title">Upload your resume (optional)</h2>
            <p className="onb-sub">We'll ask questions based on your actual projects and skills. You can skip this and add it later.</p>

            {!resume ? (
              <div className="resume-drop" onClick={() => fileRef.current.click()}>
                <Upload size={28} color="var(--primary)"/>
                <p>Click to upload resume</p>
                <span>.txt, .pdf, .doc — Max 2MB</span>
                <input ref={fileRef} type="file" accept=".txt,.pdf,.doc,.docx" style={{display:'none'}} onChange={handleFile}/>
              </div>
            ) : (
              <div className="resume-uploaded">
                <FileText size={18} color="var(--primary)"/>
                <span>{resume.name}</span>
                <button className="btn btn-ghost btn-icon" onClick={() => { setResume(null); setResumeText('') }} style={{marginLeft:'auto'}}><X size={15}/></button>
              </div>
            )}

            <div style={{display:'flex', gap:10, marginTop:'1.25rem'}}>
              <button className="btn btn-outline" onClick={() => setStep(2)}>Back</button>
              <button className="btn btn-ghost btn-full" onClick={finish} disabled={loading}>Skip for now</button>
              <button className="btn btn-primary btn-full btn-lg" onClick={finish} disabled={loading || !resume}>
                {loading ? <><div className="spinner"/>Saving…</> : 'Finish Setup'}
              </button>
            </div>
          </>
        )}
      </div>
    </div>
  )
}