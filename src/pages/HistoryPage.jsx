import React, { useEffect, useState } from 'react'
import { useNavigate } from 'react-router-dom'
import { supabase } from '../utils/supabase.js'
import { useAuth } from '../contexts/AuthContext.jsx'
import { Trash2, Zap, TrendingUp, Award, Calendar } from 'lucide-react'
import './HistoryPage.css'

export default function HistoryPage() {
  const navigate = useNavigate()
  const { user } = useAuth()
  const [history, setHistory] = useState([])
  const [loading, setLoading] = useState(true)

  useEffect(() => { if (user) fetchHistory() }, [user])

  async function fetchHistory() {
    setLoading(true)
    const { data } = await supabase
      .from('interview_sessions')
      .select('id, role, mode, difficulty, overall_score, created_at, status')
      .eq('user_id', user.id)
      .eq('status', 'completed')
      .order('created_at', { ascending: false })

    setHistory(data || [])
    setLoading(false)
  }

  async function handleClear() {
    if (!window.confirm('Delete all interview history? This cannot be undone.')) return
    const ids = history.map(h => h.id)
    await supabase.from('interview_qa').delete().in('session_id', ids)
    await supabase.from('interview_sessions').delete().in('id', ids)
    setHistory([])
  }

  async function handleDelete(id) {
    await supabase.from('interview_qa').delete().eq('session_id', id)
    await supabase.from('interview_sessions').delete().eq('id', id)
    setHistory(prev => prev.filter(h => h.id !== id))
  }

  if (loading) return <div className="full-loader"><div className="spinner-lg" /></div>

  const avg = history.length
    ? (history.reduce((s, h) => s + parseFloat(h.overall_score || 0), 0) / history.length).toFixed(1)
    : '—'
  const best = history.length
    ? Math.max(...history.map(h => parseFloat(h.overall_score || 0))).toFixed(1)
    : '—'

  if (!history.length) return (
    <div className="page-wrap">
      <div className="card empty-state" style={{ marginTop: '2rem' }}>
        <TrendingUp size={48} style={{ opacity: 0.2, display: 'block', margin: '0 auto 12px' }} />
        <h3>No interviews yet</h3>
        <p>Start your first interview to track your progress here.</p>
        <button className="btn btn-primary" style={{ marginTop: '1.5rem' }} onClick={() => navigate('/setup')}>
          <Zap size={15} /> Start First Interview
        </button>
      </div>
    </div>
  )

  return (
    <div className="page-wrap">
      <div className="hist-header">
        <h1 className="hist-title">Interview History</h1>
        <p className="hist-sub">Track your progress — every session, every score.</p>
      </div>

      <div className="hist-stats-grid">
        <div className="stat-card">
          <div className="stat-icon"><Award size={20} /></div>
          <div className="stat-num">{history.length}</div>
          <div className="stat-lbl">Total Sessions</div>
        </div>
        <div className="stat-card">
          <div className="stat-icon"><TrendingUp size={20} /></div>
          <div className="stat-num">{avg}</div>
          <div className="stat-lbl">Average Score</div>
        </div>
        <div className="stat-card">
          <div className="stat-icon"><Zap size={20} /></div>
          <div className="stat-num">{best}</div>
          <div className="stat-lbl">Best Score</div>
        </div>
      </div>

      {history.length >= 2 && (
        <div className="card" style={{ marginBottom: '1rem' }}>
          <h2 className="hist-section-title">Score Trend</h2>
          <div className="score-chart">
            {history.slice(0, 10).reverse().map(h => {
              const score = parseFloat(h.overall_score) || 0
              const pct = (score / 10) * 100
              const color = score >= 7 ? 'var(--success)' : score >= 5 ? 'var(--primary)' : 'var(--warning)'
              return (
                <div key={h.id} className="chart-col">
                  <span className="chart-label">{h.overall_score || '—'}</span>
                  <div className="chart-bar-wrap">
                    <div className="chart-bar" style={{ height: `${pct}%`, background: color }} />
                  </div>
                  <span className="chart-x-label">{formatDate(h.created_at)}</span>
                </div>
              )
            })}
          </div>
        </div>
      )}

      <div className="card">
        <div className="hist-list-header">
          <h2 className="hist-section-title" style={{ margin: 0 }}>All Sessions</h2>
          <button className="btn btn-ghost" style={{ fontSize: 13, color: 'var(--danger)' }} onClick={handleClear}>
            <Trash2 size={14} /> Clear All
          </button>
        </div>
        {history.map(h => (
          <div key={h.id} className="hist-item">
            <div className="hist-item-left" style={{ cursor: 'pointer' }} onClick={() => navigate(`/results/${h.id}`)}>
              <span className={`hist-score-badge ${parseFloat(h.overall_score) >= 7 ? 'good' : parseFloat(h.overall_score) >= 5 ? 'ok' : 'low'}`}>
                {h.overall_score || '—'}
              </span>
              <div>
                <div className="hist-role">{h.role}</div>
                <div className="hist-meta">
                  <span className="badge badge-purple" style={{ fontSize: 11 }}>{h.mode}</span>
                  <span className="badge badge-purple" style={{ fontSize: 11 }}>{h.difficulty}</span>
                  <span style={{ fontSize: 11, color: 'var(--text3)', display: 'flex', alignItems: 'center', gap: 3 }}>
                    <Calendar size={10} /> {formatDate(h.created_at)}
                  </span>
                </div>
              </div>
            </div>
            <button className="btn btn-ghost" style={{ padding: '6px', color: 'var(--text3)' }}
              onClick={() => handleDelete(h.id)} title="Delete">
              <Trash2 size={15} />
            </button>
          </div>
        ))}
      </div>

      <div style={{ marginTop: '1rem' }}>
        <button className="btn btn-primary btn-full" onClick={() => navigate('/setup')}>
          <Zap size={16} /> New Interview
        </button>
      </div>
    </div>
  )
}

function formatDate(iso) {
  if (!iso) return ''
  try { return new Date(iso).toLocaleDateString('en-IN', { day: 'numeric', month: 'short' }) }
  catch { return '' }
}