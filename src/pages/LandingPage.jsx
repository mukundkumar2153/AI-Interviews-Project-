import React from 'react'
import { useNavigate } from 'react-router-dom'
import { Zap, Star, TrendingUp, Award, Users, Code2, BarChart2, Megaphone, Banknote, Building2, Landmark, ChevronRight, CheckCircle2, Brain, FileText, MessageSquare, Mic2, Shield, Trophy, Flame } from 'lucide-react'
import './LandingPage.css'

const FEATURES = [
  { icon: <Brain size={22}/>,        title: 'AI-Powered Questions',     desc: 'Groq AI generates role-specific, personalized questions based on your resume and experience level.' },
  { icon: <FileText size={22}/>,     title: 'Resume-Based Interview',   desc: 'Upload your resume and AI will ask questions specifically about your skills, projects and experience.' },
  { icon: <Mic2 size={22}/>,         title: 'Voice Interview Mode',     desc: 'AI speaks the question aloud. You answer with your voice — just like a real interview room.' },
  { icon: <MessageSquare size={22}/>,title: 'Smart Follow-up Questions',desc: 'If your answer is incomplete, AI asks intelligent follow-up questions — just like a real interviewer.' },
  { icon: <TrendingUp size={22}/>,   title: 'Progress Tracking',        desc: 'Track your improvement over time with detailed charts, streak counters, and session history.' },
  { icon: <Award size={22}/>,        title: 'PDF Report Download',      desc: 'Get a detailed report card with scores, strengths, and improvements — shareable on LinkedIn.' },
  { icon: <Trophy size={22}/>,       title: 'Leaderboard',              desc: 'Compete with other candidates in your role category. Rise to the top and show your skills.' },
  { icon: <Flame size={22}/>,        title: 'Daily Challenges + Streak',desc: 'Solve one question every day — maintain your streak like Duolingo and stay interview-ready.' },
]

const ROLES = [
  { icon: <Code2 size={18}/>,      label: 'Software Developer' },
  { icon: <BarChart2 size={18}/>,  label: 'Data Analyst' },
  { icon: <Megaphone size={18}/>,  label: 'Marketing' },
  { icon: <Users size={18}/>,      label: 'HR' },
  { icon: <Banknote size={18}/>,   label: 'Sales' },
  { icon: <Building2 size={18}/>,  label: 'Finance' },
  { icon: <Landmark size={18}/>,   label: 'Banking' },
  { icon: <Shield size={18}/>,     label: 'Government' },
]

const TESTIMONIALS = [
  { name: 'Rahul Sharma', role: 'Got hired at Amazon', text: 'InterviewAI helped me prepare in just 2 weeks. The AI feedback was brutally honest and that is exactly what I needed.', score: 9.2 },
  { name: 'Priya Mehta', role: 'HR Manager at Infosys', text: 'The behavioral round simulation was incredibly realistic. I felt 100x more confident walking into my actual interview.', score: 8.7 },
  { name: 'Arjun Verma', role: 'Data Analyst at Flipkart', text: 'The resume-based questions were a game changer. It felt like the AI had actually read my CV and knew exactly what to ask.', score: 9.5 },
]

const FREE_FEATURES  = ['3 interviews per month', 'Basic AI feedback', 'Progress tracking', 'Daily challenge access', 'Leaderboard access']
const PRO_FEATURES   = ['Unlimited interviews', 'Detailed AI feedback report', 'Voice interview mode', 'Resume-based questions', 'PDF report download', 'Company-specific packs', 'AI interviewer personas', 'LinkedIn score card share', 'Priority support']

export default function LandingPage() {
  const navigate = useNavigate()

  return (
    <div className="landing">

      {/* ── Hero ── */}
      <section className="hero">
        <div className="hero-inner">
          <div className="hero-badge"><Zap size={13}/> AI-Powered Mock Interview Platform</div>
          <h1 className="hero-h1">
            Practice Interviews<br/>
            <span className="hero-gradient">Like It's Real</span>
          </h1>
          <p className="hero-sub">
            Role-specific AI questions • Instant feedback • Voice mode • Resume-based interviews.<br/>
            Get job-ready in days, not months.
          </p>
          <div className="hero-ctas">
            <button className="btn btn-primary btn-lg" onClick={() => navigate('/auth?mode=signup')}>
              Start Free — No Card Needed <ChevronRight size={18}/>
            </button>
            <button className="btn btn-outline btn-lg" onClick={() => navigate('/pricing')}>
              View Pricing
            </button>
          </div>
          <div className="hero-social-proof">
            <div className="proof-avatars">
              {['R','P','A','S','M'].map(l => <div key={l} className="proof-av">{l}</div>)}
            </div>
            <div className="proof-text">
              <div className="proof-stars">{'★'.repeat(5)}</div>
              <span>Trusted by 10,000+ job seekers across India</span>
            </div>
          </div>
        </div>
      </section>

      {/* ── Roles Marquee ── */}
      <section className="roles-section">
        <p className="roles-label">Interviews for every career path</p>
        <div className="roles-row">
          {ROLES.map(r => (
            <div key={r.label} className="role-chip" onClick={() => navigate('/auth?mode=signup')}>
              {r.icon} {r.label}
            </div>
          ))}
        </div>
      </section>

      {/* ── Features ── */}
      <section className="features-section" id="features">
        <div className="features-inner">
          <p className="section-eyebrow">Everything You Need</p>
          <h2 className="section-title" style={{textAlign:'center', marginBottom:'2.5rem'}}>
            Built for the Indian Job Market
          </h2>
          <div className="features-grid">
            {FEATURES.map(f => (
              <div key={f.title} className="feature-card">
                <div className="feature-icon">{f.icon}</div>
                <h3 className="feature-title">{f.title}</h3>
                <p className="feature-desc">{f.desc}</p>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* ── Testimonials ── */}
      <section className="testimonials-section">
        <div className="features-inner">
          <p className="section-eyebrow" style={{textAlign:'center'}}>Success Stories</p>
          <h2 className="section-title" style={{textAlign:'center', marginBottom:'2rem'}}>Real Results, Real People</h2>
          <div className="testimonials-grid">
            {TESTIMONIALS.map(t => (
              <div key={t.name} className="testimonial-card">
                <div className="t-score">{t.score}<span>/10</span></div>
                <p className="t-text">"{t.text}"</p>
                <div className="t-author">
                  <div className="t-av">{t.name[0]}</div>
                  <div>
                    <div className="t-name">{t.name}</div>
                    <div className="t-role">{t.role}</div>
                  </div>
                </div>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* ── Pricing Preview ── */}
      <section className="pricing-preview">
        <div className="features-inner">
          <p className="section-eyebrow" style={{textAlign:'center'}}>Pricing</p>
          <h2 className="section-title" style={{textAlign:'center', marginBottom:'2rem'}}>Start Free, Upgrade When Ready</h2>
          <div className="pricing-grid">
            <div className="pricing-card">
              <div className="plan-name">Free</div>
              <div className="plan-price">₹0<span>/month</span></div>
              <ul className="plan-features">
                {FREE_FEATURES.map(f => <li key={f}><CheckCircle2 size={15} color="var(--success)"/> {f}</li>)}
              </ul>
              <button className="btn btn-outline btn-full" onClick={() => navigate('/auth?mode=signup')}>Get Started Free</button>
            </div>
            <div className="pricing-card premium">
              <div className="plan-badge">Most Popular</div>
              <div className="plan-name">Premium</div>
              <div className="plan-price">₹499<span>/month</span></div>
              <ul className="plan-features">
                {PRO_FEATURES.map(f => <li key={f}><CheckCircle2 size={15} color="#fff"/> {f}</li>)}
              </ul>
              <button className="btn btn-full" style={{background:'#fff', color:'var(--primary)', fontWeight:700}} onClick={() => navigate('/auth?mode=signup')}>Start Free Trial</button>
            </div>
          </div>
        </div>
      </section>

      {/* ── CTA ── */}
      <section className="cta-section">
        <h2 className="cta-h2">Ready to Ace Your Next Interview?</h2>
        <p className="cta-sub">Join thousands of candidates who landed their dream jobs with InterviewAI.</p>
        <button className="btn btn-primary btn-lg" onClick={() => navigate('/auth?mode=signup')}>
          Get Started — It's Free <ChevronRight size={18}/>
        </button>
      </section>

      <footer className="landing-footer">
        <div className="footer-inner">
          <span className="nav-logo">Interview<span>AI</span></span>
          <p>© 2025 InterviewAI. Built for India's job seekers.</p>
        </div>
      </footer>
    </div>
  )
}