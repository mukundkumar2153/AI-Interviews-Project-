import React, { useEffect, useState } from 'react'
import { useAuth } from '../contexts/AuthContext.jsx'
import { supabase } from '../utils/supabase.js'
import { Trophy, Medal, Crown } from 'lucide-react'
import './LeaderboardPage.css'

const ROLES = ['All Roles', 'Software Developer', 'Data Analyst', 'Marketing Manager', 'HR Manager', 'Sales Executive', 'Finance Analyst', 'Banking Professional', 'Government/PSU']

export default function LeaderboardPage() {
  const { user } = useAuth()
  const [role, setRole]       = useState('All Roles')
  const [rows, setRows]       = useState([])
  const [loading, setLoading] = useState(true)

  useEffect(() => { fetchLeaderboard() }, [role])

  async function fetchLeaderboard() {
    setLoading(true)
    let query = supabase
      .from('interview_sessions')
      .select('user_id, role, overall_score, user_profiles(full_name)')
      .eq('status', 'completed')
      .order('overall_score', { ascending: false })
      .limit(200)

    if (role !== 'All Roles') query = query.eq('role', role)

    const { data, error } = await query
    if (error) { console.error(error); setRows([]); setLoading(false); return }

    // Keep best score per user
    const bestPerUser = new Map()
    for (const r of data || []) {
      const existing = bestPerUser.get(r.user_id)
      if (!existing || parseFloat(r.overall_score) > parseFloat(existing.overall_score)) {
        bestPerUser.set(r.user_id, r)
      }
    }
    const ranked = Array.from(bestPerUser.values())
      .sort((a, b) => parseFloat(b.overall_score) - parseFloat(a.overall_score))
      .slice(0, 50)

    setRows(ranked)
    setLoading(false)
  }

  const myRank = rows.findIndex(r => r.user_id === user?.id)

  if (loading) return <div className="full-loader"><div className="spinner-lg" /></div>

  return (
    <div className="page-wrap">
      <div className="lb-header">
        <h1><Trophy size={24} color="#F59E0B" /> Leaderboard</h1>
        <p>Top performers across InterviewAI. Keep practicing to climb the ranks.</p>
      </div>

      <div className="lb-filter-row">
        {ROLES.map(r => (
          <button key={r} className={`pill ${role === r ? 'selected' : ''}`} onClick={() => setRole(r)}>{r}</button>
        ))}
      </div>

      {myRank >= 0 && (
        <div className="lb-my-rank-banner">
          <Crown size={16} /> Your current rank: <strong>#{myRank + 1}</strong> with a best score of <strong>{rows[myRank].overall_score}/10</strong>
        </div>
      )}

      <div className="card">
        {rows.length === 0 ? (
          <div className="empty-state" style={{ padding: '2rem 0' }}>
            <Trophy size={36} style={{ opacity: 0.2, margin: '0 auto 10px', display: 'block' }} />
            <p>No completed interviews yet for this role. Be the first to rank!</p>
          </div>
        ) : (
          <div className="lb-list">
            {rows.map((r, i) => (
              <div key={r.user_id} className={`lb-item ${r.user_id === user?.id ? 'me' : ''}`}>
                <div className="lb-rank">
                  {i === 0 ? <Medal size={20} color="#F59E0B" /> :
                   i === 1 ? <Medal size={20} color="#94A3B8" /> :
                   i === 2 ? <Medal size={20} color="#B45309" /> :
                   <span className="lb-rank-num">#{i + 1}</span>}
                </div>
                <div className="lb-name-block">
                  <div className="lb-name">{r.user_profiles?.full_name || 'Anonymous'}{r.user_id === user?.id && <span className="badge badge-purple" style={{ fontSize: 10, marginLeft: 6 }}>You</span>}</div>
                  <div className="lb-role">{r.role}</div>
                </div>
                <div className="lb-score">{r.overall_score}<span>/10</span></div>
              </div>
            ))}
          </div>
        )}
      </div>
    </div>
  )
}