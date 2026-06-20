import React, { useState } from 'react'
import { NavLink, useNavigate, useLocation } from 'react-router-dom'
import { useAuth } from '../contexts/AuthContext.jsx'
import { Zap, LayoutDashboard, History, Trophy, LogOut, User, Menu, X, Crown } from 'lucide-react'
import './Navbar.css'

export default function Navbar() {
  const { user, profile, signOut } = useAuth()
  const navigate  = useNavigate()
  const location  = useLocation()
  const [mobileOpen, setMobileOpen] = useState(false)

  const isLanding = location.pathname === '/'

  async function handleSignOut() {
    await signOut()
    navigate('/')
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
              <div className="nav-avatar" title={profile?.full_name || user.email} onClick={() => setMobileOpen(!mobileOpen)}>
                {profile?.avatar_url
                  ? <img src={profile.avatar_url} alt="avatar" />
                  : <span>{(profile?.full_name || user.email || 'U')[0].toUpperCase()}</span>
                }
              </div>
              <button className="btn btn-ghost btn-sm btn-icon" onClick={handleSignOut} title="Sign Out">
                <LogOut size={16}/>
              </button>
            </>
          ) : (
            <>
              <NavLink to="/auth" className="btn btn-ghost btn-sm">Log In</NavLink>
              <NavLink to="/auth?mode=signup" className="btn btn-primary btn-sm">Get Started Free</NavLink>
            </>
          )}
          <button className="mobile-menu-btn btn btn-ghost btn-icon" onClick={() => setMobileOpen(!mobileOpen)}>
            {mobileOpen ? <X size={20}/> : <Menu size={20}/>}
          </button>
        </div>
      </div>

      {/* Mobile menu */}
      {mobileOpen && (
        <div className="mobile-menu">
          {user ? (
            <>
              <NavLink to="/dashboard"   onClick={() => setMobileOpen(false)} className="mobile-link"><LayoutDashboard size={16}/> Dashboard</NavLink>
              <NavLink to="/setup"       onClick={() => setMobileOpen(false)} className="mobile-link"><Zap size={16}/> Practice</NavLink>
              <NavLink to="/history"     onClick={() => setMobileOpen(false)} className="mobile-link"><History size={16}/> History</NavLink>
              <NavLink to="/leaderboard" onClick={() => setMobileOpen(false)} className="mobile-link"><Trophy size={16}/> Leaderboard</NavLink>
              <NavLink to="/pricing"     onClick={() => setMobileOpen(false)} className="mobile-link"><Crown size={16}/> Upgrade</NavLink>
              <button className="mobile-link" onClick={handleSignOut}><LogOut size={16}/> Sign Out</button>
            </>
          ) : (
            <>
              <NavLink to="/auth"          onClick={() => setMobileOpen(false)} className="mobile-link">Log In</NavLink>
              <NavLink to="/auth?mode=signup" onClick={() => setMobileOpen(false)} className="mobile-link">Get Started Free</NavLink>
              <NavLink to="/pricing"       onClick={() => setMobileOpen(false)} className="mobile-link">Pricing</NavLink>
            </>
          )}
        </div>
      )}
    </nav>
  )
}