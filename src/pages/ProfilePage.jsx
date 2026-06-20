import React, { useState, useRef } from 'react'
import { useNavigate } from 'react-router-dom'
import { supabase } from '../utils/supabase.js'
import { useAuth } from '../contexts/AuthContext.jsx'
import { Camera, FileText, Upload, X, Crown, Save, Phone, MapPin, User, Mail, Loader2 } from 'lucide-react'
import './ProfilePage.css'

export default function ProfilePage() {
  const navigate = useNavigate()
  const { user, profile, refreshProfile } = useAuth()

  const [fullName, setFullName] = useState(profile?.full_name || '')
  const [phone, setPhone]       = useState(profile?.phone || '')
  const [address, setAddress]   = useState(profile?.address || '')
  const [role, setRole]         = useState(profile?.role || '')
  const [level, setLevel]       = useState(profile?.experience_level || '')

  const [avatarPreview, setAvatarPreview] = useState(profile?.avatar_url || '')
  const [resumeName, setResumeName]       = useState(profile?.resume_filename || '')

  const [saving, setSaving]   = useState(false)
  const [uploadingAvatar, setUploadingAvatar] = useState(false)
  const [uploadingResume, setUploadingResume] = useState(false)
  const [message, setMessage] = useState('')
  const [error, setError]     = useState('')

  const avatarInputRef = useRef()
  const resumeInputRef = useRef()

  async function handleAvatarChange(e) {
    const file = e.target.files[0]
    if (!file) return
    if (file.size > 2 * 1024 * 1024) { setError('Image must be under 2MB.'); return }

    setUploadingAvatar(true); setError('')
    try {
      const ext = file.name.split('.').pop()
      const path = `${user.id}/avatar.${ext}`

      const { error: upErr } = await supabase.storage.from('avatars').upload(path, file, { upsert: true })
      if (upErr) throw upErr

      const { data: urlData } = supabase.storage.from('avatars').getPublicUrl(path)
      const publicUrl = `${urlData.publicUrl}?t=${Date.now()}` // cache-bust

      await supabase.from('user_profiles').update({ avatar_url: publicUrl, updated_at: new Date().toISOString() }).eq('id', user.id)
      setAvatarPreview(publicUrl)
      await refreshProfile()
      setMessage('Profile picture updated!')
    } catch (err) {
      setError(err.message || 'Failed to upload image.')
    }
    setUploadingAvatar(false)
  }

  async function handleResumeChange(e) {
    const file = e.target.files[0]
    if (!file) return
    if (file.size > 3 * 1024 * 1024) { setError('Resume must be under 3MB.'); return }

    setUploadingResume(true); setError('')
    try {
      const ext = file.name.split('.').pop()
      const path = `${user.id}/resume.${ext}`

      const { error: upErr } = await supabase.storage.from('resumes').upload(path, file, { upsert: true })
      if (upErr) throw upErr

      // Try reading as text for AI question generation (works well for .txt; partial for others)
      let resumeText = ''
      if (file.type === 'text/plain' || ext === 'txt') {
        resumeText = await file.text()
      }

      await supabase.from('user_profiles').update({
        resume_url: path,
        resume_filename: file.name,
        resume_text: resumeText || profile?.resume_text || null,
        updated_at: new Date().toISOString()
      }).eq('id', user.id)

      setResumeName(file.name)
      await refreshProfile()
      setMessage('Resume uploaded!')
    } catch (err) {
      setError(err.message || 'Failed to upload resume.')
    }
    setUploadingResume(false)
  }

  async function removeResume() {
    if (!profile?.resume_url) return
    await supabase.storage.from('resumes').remove([profile.resume_url])
    await supabase.from('user_profiles').update({ resume_url: null, resume_filename: null, resume_text: null }).eq('id', user.id)
    setResumeName('')
    await refreshProfile()
  }

  async function handleSave(e) {
    e.preventDefault()
    setSaving(true); setError(''); setMessage('')
    try {
      // Phone required once user starts editing profile (as requested)
      if (!phone.trim()) { setError('Phone number is required.'); setSaving(false); return }

      const { error: updErr } = await supabase.from('user_profiles').update({
        full_name: fullName, phone, address, role, experience_level: level,
        updated_at: new Date().toISOString()
      }).eq('id', user.id)
      if (updErr) throw updErr

      await refreshProfile()
      setMessage('Profile updated successfully!')
    } catch (err) {
      setError(err.message || 'Failed to save profile.')
    }
    setSaving(false)
  }

  return (
    <div className="page-wrap">
      <div className="profile-hdr">
        <h1>My Profile</h1>
        <p>Manage your personal details, resume, and account settings.</p>
      </div>

      {/* ── Avatar ── */}
      <div className="card profile-card">
        <div className="avatar-row">
          <div className="avatar-wrap" onClick={() => avatarInputRef.current.click()}>
            {avatarPreview ? <img src={avatarPreview} alt="Avatar" /> : <User size={32} color="var(--text3)" />}
            <div className="avatar-overlay">{uploadingAvatar ? <Loader2 size={16} className="spin-icon" /> : <Camera size={16} />}</div>
          </div>
          <input ref={avatarInputRef} type="file" accept="image/*" style={{ display: 'none' }} onChange={handleAvatarChange} />
          <div>
            <div className="profile-name">{profile?.full_name || 'Your Name'}</div>
            <div className="profile-email"><Mail size={12} /> {user?.email}</div>
            {profile?.is_premium && <span className="badge badge-amber" style={{ marginTop: 6 }}><Crown size={11} /> Premium Member</span>}
          </div>
        </div>
      </div>

      {/* ── Personal Details ── */}
      <form onSubmit={handleSave} className="card profile-card">
        <h3 className="profile-section-title">Personal Details</h3>

        <div className="field">
          <label className="field-label"><User size={13} /> Full Name</label>
          <input type="text" value={fullName} onChange={e => setFullName(e.target.value)} required />
        </div>

        <div className="two-col">
          <div className="field">
            <label className="field-label"><Phone size={13} /> Phone Number *</label>
            <input type="tel" placeholder="+91 9XXXXXXXXX" value={phone} onChange={e => setPhone(e.target.value)} required />
          </div>
          <div className="field">
            <label className="field-label">Job Role</label>
            <input type="text" value={role} onChange={e => setRole(e.target.value)} />
          </div>
        </div>

        <div className="field">
          <label className="field-label"><MapPin size={13} /> Address</label>
          <input type="text" placeholder="City, State, India" value={address} onChange={e => setAddress(e.target.value)} />
        </div>

        <div className="field">
          <label className="field-label">Experience Level</label>
          <select value={level} onChange={e => setLevel(e.target.value)}>
            <option value="Fresher">Fresher</option>
            <option value="Mid-Level">Mid-Level</option>
            <option value="Senior">Senior</option>
          </select>
        </div>

        {error && <p className="error-msg">{error}</p>}
        {message && <p className="success-msg">{message}</p>}

        <button type="submit" className="btn btn-primary" disabled={saving}>
          {saving ? <><Loader2 size={15} className="spin-icon" /> Saving…</> : <><Save size={15} /> Save Changes</>}
        </button>
      </form>

      {/* ── Resume ── */}
      <div className="card profile-card">
        <h3 className="profile-section-title">Resume</h3>
        <p className="profile-section-desc">Upload your resume so AI can ask personalized interview questions based on your real skills and projects.</p>

        {resumeName ? (
          <div className="resume-uploaded-row">
            <FileText size={18} color="var(--primary)" />
            <span>{resumeName}</span>
            <button type="button" className="btn btn-ghost btn-icon" onClick={removeResume}><X size={15} /></button>
          </div>
        ) : (
          <div className="resume-drop" onClick={() => resumeInputRef.current.click()}>
            {uploadingResume ? <Loader2 size={24} className="spin-icon" color="var(--primary)" /> : <Upload size={24} color="var(--primary)" />}
            <p>Click to upload resume</p>
            <span>.txt, .pdf, .doc — Max 3MB</span>
          </div>
        )}
        <input ref={resumeInputRef} type="file" accept=".txt,.pdf,.doc,.docx" style={{ display: 'none' }} onChange={handleResumeChange} />
      </div>
    </div>
  )
}