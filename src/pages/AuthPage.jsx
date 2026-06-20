import React, { useState, useEffect } from 'react'
import { useNavigate, useSearchParams, Link } from 'react-router-dom'
import { supabase } from '../utils/supabase.js'
import { Mail, Lock, User, Eye, EyeOff, Chrome } from 'lucide-react'
import './AuthPage.css'

export default function AuthPage() {
  const navigate       = useNavigate()
  const [params]       = useSearchParams()
  const [mode, setMode] = useState(params.get('mode') === 'signup' ? 'signup' : 'login')
  const [form, setForm] = useState({ name: '', email: '', password: '' })
  const [showPw, setShowPw] = useState(false)
  const [loading, setLoading] = useState(false)
  const [error, setError]   = useState('')
  const [success, setSuccess] = useState('')

  function update(k, v) { setForm(p => ({...p, [k]: v})); setError('') }

  async function handleSubmit(e) {
    e.preventDefault()
    setLoading(true); setError(''); setSuccess('')
    try {
      if (mode === 'signup') {
        const { error } = await supabase.auth.signUp({
          email: form.email, password: form.password,
          options: { data: { full_name: form.name } }
        })
        if (error) throw error
        setSuccess('Account created! Check your email to confirm, then log in.')
        setMode('login')
      } else {
        const { error } = await supabase.auth.signInWithPassword({ email: form.email, password: form.password })
        if (error) throw error
        navigate('/dashboard')
      }
    } catch (err) {
      setError(err.message || 'Something went wrong. Please try again.')
    }
    setLoading(false)
  }

  async function handleGoogle() {
    const { error } = await supabase.auth.signInWithOAuth({
      provider: 'google',
      options: { redirectTo: `${window.location.origin}/dashboard` }
    })
    if (error) setError(error.message)
  }

  return (
    <div className="auth-page">
      <div className="auth-card card card-lg">
        {/* Logo */}
        <div className="auth-logo" onClick={() => navigate('/')}>Interview<span>AI</span></div>

        {/* Tabs */}
        <div className="auth-tabs">
          <button className={`auth-tab ${mode === 'login' ? 'active' : ''}`} onClick={() => { setMode('login'); setError(''); setSuccess('') }}>Log In</button>
          <button className={`auth-tab ${mode === 'signup' ? 'active' : ''}`} onClick={() => { setMode('signup'); setError(''); setSuccess('') }}>Sign Up</button>
        </div>

        {/* Google */}
        <button className="btn btn-outline btn-full google-btn" onClick={handleGoogle}>
          <Chrome size={17}/> Continue with Google
        </button>

        <div className="auth-or"><span>or</span></div>

        {/* Form */}
        <form onSubmit={handleSubmit}>
          {mode === 'signup' && (
            <div className="field">
              <label className="field-label">Full Name</label>
              <div className="input-wrap">
                <User size={15} className="input-icon"/>
                <input type="text" placeholder="Your name" value={form.name} onChange={e => update('name', e.target.value)} required/>
              </div>
            </div>
          )}
          <div className="field">
            <label className="field-label">Email</label>
            <div className="input-wrap">
              <Mail size={15} className="input-icon"/>
              <input type="email" placeholder="you@example.com" value={form.email} onChange={e => update('email', e.target.value)} required/>
            </div>
          </div>
          <div className="field">
            <label className="field-label">Password</label>
            <div className="input-wrap">
              <Lock size={15} className="input-icon"/>
              <input type={showPw ? 'text' : 'password'} placeholder="Min. 6 characters" value={form.password} onChange={e => update('password', e.target.value)} required minLength={6}/>
              <button type="button" className="pw-toggle" onClick={() => setShowPw(!showPw)}>
                {showPw ? <EyeOff size={15}/> : <Eye size={15}/>}
              </button>
            </div>
          </div>

          {error   && <p className="error-msg">{error}</p>}
          {success && <p className="success-msg">{success}</p>}

          <button type="submit" className="btn btn-primary btn-full btn-lg" disabled={loading} style={{marginTop:'0.5rem'}}>
            {loading ? <><div className="spinner"/>{mode === 'signup' ? 'Creating account…' : 'Logging in…'}</> : mode === 'signup' ? 'Create Free Account' : 'Log In'}
          </button>
        </form>

        <p className="auth-footer-text">
          {mode === 'login' ? "Don't have an account? " : 'Already have an account? '}
          <button className="auth-link" onClick={() => { setMode(mode === 'login' ? 'signup' : 'login'); setError(''); setSuccess('') }}>
            {mode === 'login' ? 'Sign up free' : 'Log in'}
          </button>
        </p>
      </div>
    </div>
  )
}