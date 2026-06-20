import React from 'react'
import { Zap, Heart, Target } from 'lucide-react'

export default function AboutPage() {
  return (
    <div className="page-wrap" style={{ maxWidth: 640 }}>
      <h1 style={{ fontSize: 26, fontWeight: 800, marginBottom: 10 }}>About InterviewAI</h1>
      <p style={{ color: 'var(--text2)', lineHeight: 1.7, marginBottom: '1.5rem' }}>
        InterviewAI is an AI-powered mock interview platform built specifically for Indian job seekers.
        We combine role-specific question generation, voice interaction, and instant AI feedback to help
        you prepare for real interviews with confidence.
      </p>
      <div className="card" style={{ marginBottom: '1rem' }}>
        <h3 style={{ display: 'flex', alignItems: 'center', gap: 8, marginBottom: 8 }}><Target size={18} color="var(--primary)" /> Our Mission</h3>
        <p style={{ fontSize: 14, color: 'var(--text2)' }}>Make quality interview preparation accessible to every job seeker in India, regardless of background.</p>
      </div>
      <div className="card">
        <h3 style={{ display: 'flex', alignItems: 'center', gap: 8, marginBottom: 8 }}><Heart size={18} color="var(--danger)" /> Built With Care</h3>
        <p style={{ fontSize: 14, color: 'var(--text2)' }}>Powered by Groq AI, Supabase, and a genuine desire to help you land your dream job.</p>
      </div>
    </div>
  )
}