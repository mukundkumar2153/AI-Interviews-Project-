import React, { useState } from 'react'
import { useNavigate, useSearchParams } from 'react-router-dom'
import { supabase } from '../utils/supabase.js'
import { Mail, Lock, User, Eye, EyeOff, Chrome, ArrowLeft, KeyRound } from 'lucide-react'
import './AuthPage.css'

export default function AuthPage() {
  const navigate = useNavigate()
  const [params] = useSearchParams()

  // mode: login | signup | forgot | otp | reset
  const [mode, setMode] = useState(params.get('mode') === 'signup' ? 'signup' : 'login')
  const [form, setForm] = useState({ name: '', email: '', password: '' })
  const [otp, setOtp]   = useState('')
  const [newPassword, setNewPassword] = useState('')
  const [showPw, setShowPw] = useState(false)
  const [loading, setLoading] = useState(false)
  const [error, setError]   = useState('')
  const [success, setSuccess] = useState('')

  function update(k, v) { setForm(p => ({ ...p, [k]: v })); setError('') }
  function resetMessages() { setError(''); setSuccess('') }

  async function handleSubmit(e) {
    e.preventDefault()
    setLoading(true); resetMessages()
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

  // ── Step 1: send OTP to email for password reset ──
  async function sendResetOtp(e) {
    e.preventDefault()
    setLoading(true); resetMessages()
    try {
      const { error } = await supabase.auth.signInWithOtp({
        email: form.email,
        options: { shouldCreateUser: false }
      })
      if (error) throw error
      setSuccess(`A 6-digit code has been sent to ${form.email}`)
      setMode('otp')
    } catch (err) {
      setError(err.message || 'Could not send code. Check the email address.')
    }
    setLoading(false)
  }

  // ── Step 2: verify OTP ──
  async function verifyResetOtp(e) {
    e.preventDefault()
    setLoading(true); resetMessages()
    try {
      const { error } = await supabase.auth.verifyOtp({
        email: form.email, token: otp, type: 'email'
      })
      if (error) throw error
      setSuccess('Code verified! Set your new password below.')
      setMode('reset')
    } catch (err) {
      setError(err.message || 'Invalid or expired code.')
    }
    setLoading(false)
  }

  // ── Step 3: set new password (user is now signed in via OTP) ──
  async function submitNewPassword(e) {
    e.preventDefault()
    if (newPassword.length < 6) { setError('Password must be at least 6 characters.'); return }
    setLoading(true); resetMessages()
    try {
      const { error } = await supabase.auth.updateUser({ password: newPassword })
      if (error) throw error
      setSuccess('Password changed successfully! Redirecting…')
      setTimeout(() => navigate('/dashboard'), 1200)
    } catch (err) {
      setError(err.message || 'Failed to update password.')
    }
    setLoading(false)
  }

  return (
    <div className="auth-page">
      <div className="auth-card card card-lg">
        <div className="auth-logo" onClick={() => navigate('/')}>Interview<span>AI</span></div>

        {/* ── Login / Signup ── */}
        {(mode === 'login' || mode === 'signup') && (
          <>
            <div className="auth-tabs">
              <button className={`auth-tab ${mode === 'login' ? 'active' : ''}`} onClick={() => { setMode('login'); resetMessages() }}>Log In</button>
              <button className={`auth-tab ${mode === 'signup' ? 'active' : ''}`} onClick={() => { setMode('signup'); resetMessages() }}>Sign Up</button>
            </div>

            <button className="btn btn-outline btn-full google-btn" onClick={handleGoogle}>
              <Chrome size={17} /> Continue with Google
            </button>
            <div className="auth-or"><span>or</span></div>

            <form onSubmit={handleSubmit}>
              {mode === 'signup' && (
                <div className="field">
                  <label className="field-label">Full Name</label>
                  <div className="input-wrap">
                    <User size={15} className="input-icon" />
                    <input type="text" placeholder="Your name" value={form.name} onChange={e => update('name', e.target.value)} required />
                  </div>
                </div>
              )}
              <div className="field">
                <label className="field-label">Email</label>
                <div className="input-wrap">
                  <Mail size={15} className="input-icon" />
                  <input type="email" placeholder="you@example.com" value={form.email} onChange={e => update('email', e.target.value)} required />
                </div>
              </div>
              <div className="field">
                <label className="field-label">Password</label>
                <div className="input-wrap">
                  <Lock size={15} className="input-icon" />
                  <input type={showPw ? 'text' : 'password'} placeholder="Min. 6 characters" value={form.password} onChange={e => update('password', e.target.value)} required minLength={6} />
                  <button type="button" className="pw-toggle" onClick={() => setShowPw(!showPw)}>
                    {showPw ? <EyeOff size={15} /> : <Eye size={15} />}
                  </button>
                </div>
              </div>

              {mode === 'login' && (
                <div style={{ textAlign: 'right', marginBottom: '0.75rem' }}>
                  <button type="button" className="auth-link" style={{ fontSize: 12.5 }} onClick={() => { setMode('forgot'); resetMessages() }}>
                    Forgot password?
                  </button>
                </div>
              )}

              {error && <p className="error-msg">{error}</p>}
              {success && <p className="success-msg">{success}</p>}

              <button type="submit" className="btn btn-primary btn-full btn-lg" disabled={loading} style={{ marginTop: '0.5rem' }}>
                {loading ? <><div className="spinner" />{mode === 'signup' ? 'Creating account…' : 'Logging in…'}</> : mode === 'signup' ? 'Create Free Account' : 'Log In'}
              </button>
            </form>

            <p className="auth-footer-text">
              {mode === 'login' ? "Don't have an account? " : 'Already have an account? '}
              <button className="auth-link" onClick={() => { setMode(mode === 'login' ? 'signup' : 'login'); resetMessages() }}>
                {mode === 'login' ? 'Sign up free' : 'Log in'}
              </button>
            </p>
          </>
        )}

        {/* ── Forgot Password: enter email ── */}
        {mode === 'forgot' && (
          <>
            <button className="back-link" onClick={() => { setMode('login'); resetMessages() }}><ArrowLeft size={14} /> Back to login</button>
            <h2 className="auth-step-title">Reset your password</h2>
            <p className="auth-step-sub">Enter your email and we'll send you a 6-digit verification code.</p>
            <form onSubmit={sendResetOtp}>
              <div className="field">
                <label className="field-label">Email</label>
                <div className="input-wrap">
                  <Mail size={15} className="input-icon" />
                  <input type="email" placeholder="you@example.com" value={form.email} onChange={e => update('email', e.target.value)} required />
                </div>
              </div>
              {error && <p className="error-msg">{error}</p>}
              {success && <p className="success-msg">{success}</p>}
              <button type="submit" className="btn btn-primary btn-full btn-lg" disabled={loading}>
                {loading ? <div className="spinner" /> : 'Send Verification Code'}
              </button>
            </form>
          </>
        )}

        {/* ── OTP entry ── */}
        {mode === 'otp' && (
          <>
            <button className="back-link" onClick={() => { setMode('forgot'); resetMessages() }}><ArrowLeft size={14} /> Back</button>
            <h2 className="auth-step-title">Enter verification code</h2>
            <p className="auth-step-sub">We sent a 6-digit code to <strong>{form.email}</strong></p>
            <form onSubmit={verifyResetOtp}>
              <div className="field">
                <label className="field-label">6-Digit Code</label>
                <div className="input-wrap">
                  <KeyRound size={15} className="input-icon" />
                  <input type="text" inputMode="numeric" maxLength={6} placeholder="000000" value={otp} onChange={e => setOtp(e.target.value.replace(/\D/g, ''))} required style={{ letterSpacing: '4px', fontWeight: 700, textAlign: 'center' }} />
                </div>
              </div>
              {error && <p className="error-msg">{error}</p>}
              {success && <p className="success-msg">{success}</p>}
              <button type="submit" className="btn btn-primary btn-full btn-lg" disabled={loading || otp.length !== 6}>
                {loading ? <div className="spinner" /> : 'Verify Code'}
              </button>
              <button type="button" className="auth-link" style={{ display: 'block', margin: '0.75rem auto 0' }} onClick={sendResetOtp} disabled={loading}>
                Resend code
              </button>
            </form>
          </>
        )}

        {/* ── New password ── */}
        {mode === 'reset' && (
          <>
            <h2 className="auth-step-title">Set new password</h2>
            <p className="auth-step-sub">Choose a strong password for your account.</p>
            <form onSubmit={submitNewPassword}>
              <div className="field">
                <label className="field-label">New Password</label>
                <div className="input-wrap">
                  <Lock size={15} className="input-icon" />
                  <input type={showPw ? 'text' : 'password'} placeholder="Min. 6 characters" value={newPassword} onChange={e => setNewPassword(e.target.value)} required minLength={6} />
                  <button type="button" className="pw-toggle" onClick={() => setShowPw(!showPw)}>
                    {showPw ? <EyeOff size={15} /> : <Eye size={15} />}
                  </button>
                </div>
              </div>
              {error && <p className="error-msg">{error}</p>}
              {success && <p className="success-msg">{success}</p>}
              <button type="submit" className="btn btn-primary btn-full btn-lg" disabled={loading}>
                {loading ? <div className="spinner" /> : 'Change Password'}
              </button>
            </form>
          </>
        )}
      </div>
    </div>
  )
}