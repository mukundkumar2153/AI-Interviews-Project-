import React, { useState } from 'react'
import { useNavigate } from 'react-router-dom'
import { useAuth } from '../contexts/AuthContext.jsx'
import { supabase } from '../utils/supabase.js'
import { CheckCircle2, Crown, Loader2 } from 'lucide-react'
import './PricingPage.css'

const FREE_FEATURES = [
  '3 interviews per month',
  'Basic AI feedback',
  'Progress tracking',
  'Daily challenge access',
  'Leaderboard access',
]
const PRO_FEATURES = [
  'Unlimited interviews',
  'Detailed AI feedback report',
  'Voice interview mode',
  'Resume-based questions',
  'PDF report download',
  'Company-specific question packs',
  'AI interviewer personas',
  'LinkedIn score card share',
  'Priority support',
]

export default function PricingPage() {
  const navigate = useNavigate()
  const { user, profile, refreshProfile } = useAuth()
  const [loading, setLoading] = useState(false)
  const [error, setError]     = useState('')

  function loadRazorpayScript() {
    return new Promise(resolve => {
      if (window.Razorpay) return resolve(true)
      const script = document.createElement('script')
      script.src = 'https://checkout.razorpay.com/v1/checkout.js'
      script.onload = () => resolve(true)
      script.onerror = () => resolve(false)
      document.body.appendChild(script)
    })
  }

  async function handleUpgrade() {
    if (!user) { navigate('/auth?mode=signup'); return }
    setError('')
    setLoading(true)

    const ok = await loadRazorpayScript()
    if (!ok) { setError('Payment gateway failed to load. Check your internet connection.'); setLoading(false); return }

    const amountInPaise = 49900 // ₹499

    const options = {
      key: import.meta.env.VITE_RAZORPAY_KEY_ID,
      amount: amountInPaise,
      currency: 'INR',
      name: 'InterviewAI Premium',
      description: 'Monthly Premium Subscription',
      prefill: { email: user.email, name: profile?.full_name || '' },
      theme: { color: '#5B4FCF' },
      handler: async function (response) {
        // Payment succeeded on client. Mark premium in Supabase.
        // NOTE: For production, verify response.razorpay_payment_id on a server/Edge Function
        // before granting premium — this client-side flow is for development/demo only.
        const expiry = new Date()
        expiry.setMonth(expiry.getMonth() + 1)

        await supabase.from('user_profiles').update({
          is_premium: true,
          premium_until: expiry.toISOString(),
          razorpay_payment_id: response.razorpay_payment_id,
          updated_at: new Date().toISOString(),
        }).eq('id', user.id)

        await refreshProfile()
        setLoading(false)
        navigate('/dashboard')
      },
      modal: {
        ondismiss: () => setLoading(false)
      }
    }

    const rzp = new window.Razorpay(options)
    rzp.open()
  }

  const isPremium = profile?.is_premium

  return (
    <div className="page-wrap pricing-page">
      <div className="pricing-page-hdr">
        <h1>Simple, Transparent Pricing</h1>
        <p>Start free. Upgrade anytime for unlimited access and advanced features.</p>
      </div>

      {error && <p className="error-msg" style={{ textAlign: 'center', marginBottom: '1rem' }}>{error}</p>}

      <div className="pricing-page-grid">
        {/* Free */}
        <div className="card pricing-page-card">
          <div className="plan-name">Free</div>
          <div className="plan-price">₹0<span>/month</span></div>
          <ul className="plan-features">
            {FREE_FEATURES.map(f => <li key={f}><CheckCircle2 size={15} color="var(--success)" /> {f}</li>)}
          </ul>
          {isPremium ? (
            <button className="btn btn-outline btn-full" disabled>Current plan was Free</button>
          ) : (
            <button className="btn btn-outline btn-full" onClick={() => navigate(user ? '/dashboard' : '/auth?mode=signup')}>
              {user ? 'You\'re on Free' : 'Get Started Free'}
            </button>
          )}
        </div>

        {/* Premium */}
        <div className="card pricing-page-card premium">
          <div className="plan-badge"><Crown size={12} /> Most Popular</div>
          <div className="plan-name">Premium</div>
          <div className="plan-price">₹499<span>/month</span></div>
          <ul className="plan-features">
            {PRO_FEATURES.map(f => <li key={f}><CheckCircle2 size={15} color="#fff" /> {f}</li>)}
          </ul>
          {isPremium ? (
            <button className="btn btn-full premium-active-btn" disabled>
              <Crown size={15} /> Active until {profile.premium_until ? new Date(profile.premium_until).toLocaleDateString('en-IN', { day: 'numeric', month: 'short' }) : '—'}
            </button>
          ) : (
            <button className="btn btn-full premium-cta-btn" onClick={handleUpgrade} disabled={loading}>
              {loading ? <><Loader2 size={16} className="spin-icon" /> Processing…</> : 'Upgrade Now'}
            </button>
          )}
        </div>
      </div>

      <p className="pricing-page-footnote">
        Secure payments powered by Razorpay. Cancel anytime — no questions asked.
      </p>
    </div>
  )
}