import React, { useState, useRef, useEffect } from 'react'
import { NavLink, useNavigate, useLocation } from 'react-router-dom'
import { useAuth } from '../contexts/AuthContext.jsx'
import { useTheme } from '../contexts/ThemeContext.jsx'
import {
  Zap, LayoutDashboard, History, Trophy, LogOut, User, Menu, X, Crown,
  Palette, Info, Star, Settings, ChevronDown, Check
} from 'lucide-react'
import './Navbar.css'

const THEMES = [
  { id: 'light',  label: 'Light' },
  { id: 'dark',   label: 'Dark' },
  { id: 'purple', label: 'Purple Haze' },
  { id: 'ocean',  label: 'Ocean Blue' },
]

export default function Navbar() {
  const { user, profile, signOut } = useAuth()
  const { theme, setTheme } = useTheme()
  const navigate = useNavigate()
  const location = useLocation()

  const [mobileOpen, setMobileOpen]   = useState(false)
  const [avatarOpen, setAvatarOpen]   = useState(false)
  const [menuOpen, setMenuOpen]       = useState(false)
  const [themeOpen, setThemeOpen]     = useState(false)

  const avatarRef = useRef()
  const menuRef    = useRef()

  const isLanding = location.pathname === '/'

  // Close dropdowns on outside click
  useEffect(() => {
    function onClick(e) {
      if (avatarRef.current && !avatarRef.current.contains(e.target)) setAvatarOpen(false)
      if (menuRef.current && !menuRef.current.contains(e.target)) { setMenuOpen(false); setThemeOpen(false) }
    }
    document.addEventListener('mousedown', onClick)
    return () => document.removeEventListener('mousedown', onClick)
  }, [])

  async function handleSignOut() {
    await signOut()
    navigate('/')
  }

  function go(path) {
    navigate(path)
    setAvatarOpen(false); setMenuOpen(false); setThemeOpen(false); setMobileOpen(false)
  }

  return (
    <nav className={`navbar ${isLanding ? 'navbar-transparent' : ''}`}>
      <div className="navbar-inner">
        {/* Logo */}
        <NavLink to={user ? '/dashboard' : '/'} className="nav-logo">
          Interview<span>AI</span>
        </NavLink>

        {/* Desktop links */}
        <div className="nav-center">
          {user ? (
            <>
              <NavLink to="/dashboard"   className={({isActive}) => `nav-link ${isActive ? 'active' : ''}`}><LayoutDashboard size={15}/> Dashboard</NavLink>
              <NavLink to="/setup"       className={({isActive}) => `nav-link ${isActive ? 'active' : ''}`}><Zap size={15}/> Practice</NavLink>
              <NavLink to="/history"     className={({isActive}) => `nav-link ${isActive ? 'active' : ''}`}><History size={15}/> History</NavLink>
              <NavLink to="/leaderboard" className={({isActive}) => `nav-link ${isActive ? 'active' : ''}`}><Trophy size={15}/> Leaderboard</NavLink>
            </>
          ) : (
            <>
              <a href="#features" className="nav-link">Features</a>
              <NavLink to="/pricing" className={({isActive}) => `nav-link ${isActive ? 'active' : ''}`}>Pricing</NavLink>
            </>
          )}
        </div>

        {/* Right side */}
        <div className="nav-right">
          {user ? (
            <>
              {!profile?.is_premium && (
                <button className="btn btn-sm upgrade-btn" onClick={() => navigate('/pricing')}>
                  <Crown size={13}/> Upgrade
                </button>
              )}
              {profile?.is_premium && (
                <span className="badge badge-amber" style={{fontSize:11}}><Crown size={11}/> Premium</span>
              )}

              {/* ── Avatar dropdown ── */}
              <div className="avatar-dropdown-wrap" ref={avatarRef}>
                <div className="nav-avatar" title={profile?.full_name || user.email} onClick={() => setAvatarOpen(!avatarOpen)}>
                  {profile?.avatar_url
                    ? <img src={profile.avatar_url} alt="avatar" />
                    : <span>{(profile?.full_name || user.email || 'U')[0].toUpperCase()}</span>
                  }
                </div>
                {avatarOpen && (
                  <div className="dropdown-panel avatar-panel">
                    <div className="dropdown-user-info">
                      <div className="dropdown-user-name">{profile?.full_name || 'User'}</div>
                      <div className="dropdown-user-email">{user.email}</div>
                    </div>
                    <button className="dropdown-item" onClick={() => go('/profile')}><User size={15}/> My Profile</button>
                    <button className="dropdown-item" onClick={() => go('/history')}><History size={15}/> Interview History</button>
                    <button className="dropdown-item" onClick={() => go('/pricing')}><Crown size={15}/> Subscription</button>
                    <div className="dropdown-divider" />
                    <button className="dropdown-item danger" onClick={handleSignOut}><LogOut size={15}/> Sign Out</button>
                  </div>
                )}
              </div>

              {/* ── Hamburger / More menu ── */}
              <div className="more-menu-wrap" ref={menuRef}>
                <button className="btn btn-ghost btn-sm btn-icon mobile-menu-btn" onClick={() => { setMenuOpen(!menuOpen); setThemeOpen(false) }}>
                  {menuOpen ? <X size={20}/> : <Menu size={20}/>}
                </button>
                {menuOpen && (
                  <div className="dropdown-panel more-panel">
                    <button className="dropdown-item" onClick={() => go('/profile')}><User size={15}/> Profile</button>

                    {/* Theme submenu */}
                    <button className="dropdown-item" onClick={() => setThemeOpen(!themeOpen)}>
                      <Palette size={15}/> Theme <ChevronDown size={13} style={{marginLeft:'auto', transform: themeOpen ? 'rotate(180deg)' : 'none'}}/>
                    </button>
                    {themeOpen && (
                      <div className="theme-submenu">
                        {THEMES.map(t => (
                          <button key={t.id} className="dropdown-item sub" onClick={() => setTheme(t.id)}>
                            {t.label} {theme === t.id && <Check size={13} style={{marginLeft:'auto'}}/>}
                          </button>
                        ))}
                      </div>
                    )}

                    <button className="dropdown-item" onClick={() => go('/history')}><History size={15}/> History</button>
                    <button className="dropdown-item" onClick={() => go('/leaderboard')}><Trophy size={15}/> Leaderboard</button>
                    <button className="dropdown-item" onClick={() => go('/pricing')}><Settings size={15}/> Account & Billing</button>
                    <button className="dropdown-item" onClick={() => window.open('https://forms.gle/', '_blank')}><Star size={15}/> Rate InterviewAI</button>
                    <button className="dropdown-item" onClick={() => go('/about')}><Info size={15}/> About</button>
                    <div className="dropdown-divider" />
                    <button className="dropdown-item danger" onClick={handleSignOut}><LogOut size={15}/> Sign Out</button>
                  </div>
                )}
              </div>
            </>
          ) : (
            <>
              <NavLink to="/auth" className="btn btn-ghost btn-sm">Log In</NavLink>
              <NavLink to="/auth?mode=signup" className="btn btn-primary btn-sm">Get Started Free</NavLink>
              <button className="mobile-menu-btn btn btn-ghost btn-icon" onClick={() => setMobileOpen(!mobileOpen)}>
                {mobileOpen ? <X size={20}/> : <Menu size={20}/>}
              </button>
            </>
          )}
        </div>
      </div>

      {/* Mobile menu — logged-out only (logged-in uses the dropdown above) */}
      {mobileOpen && !user && (
        <div className="mobile-menu">
          <NavLink to="/auth"             onClick={() => setMobileOpen(false)} className="mobile-link">Log In</NavLink>
          <NavLink to="/auth?mode=signup" onClick={() => setMobileOpen(false)} className="mobile-link">Get Started Free</NavLink>
          <NavLink to="/pricing"          onClick={() => setMobileOpen(false)} className="mobile-link">Pricing</NavLink>
        </div>
      )}
    </nav>
  )
}