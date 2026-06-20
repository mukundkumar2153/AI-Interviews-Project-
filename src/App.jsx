import React from 'react'
import { Routes, Route, Navigate } from 'react-router-dom'
import { useAuth } from './contexts/AuthContext.jsx'
import Navbar from './components/Navbar.jsx'

// Pages
import LandingPage    from './pages/LandingPage.jsx'
import AuthPage       from './pages/AuthPage.jsx'
import OnboardingPage from './pages/OnboardingPage.jsx'
import DashboardPage  from './pages/DashboardPage.jsx'
import SetupPage      from './pages/SetupPage.jsx'
import InterviewPage  from './pages/InterviewPage.jsx'
import ResultsPage    from './pages/ResultsPage.jsx'
import HistoryPage    from './pages/HistoryPage.jsx'
import PricingPage    from './pages/PricingPage.jsx'
import LeaderboardPage from './pages/LeaderboardPage.jsx'

function ProtectedRoute({ children }) {
  const { user, loading } = useAuth()
  if (loading) return <div className="full-loader"><div className="spinner-lg" /></div>
  if (!user) return <Navigate to="/auth" replace />
  return children
}

function PublicOnlyRoute({ children }) {
  const { user, loading } = useAuth()
  if (loading) return <div className="full-loader"><div className="spinner-lg" /></div>
  if (user) return <Navigate to="/dashboard" replace />
  return children
}

const PUBLIC_PATHS = ['/', '/auth', '/pricing']

export default function App() {
  const { user } = useAuth()

  return (
    <div className="app-shell">
      <Navbar />
      <Routes>
        {/* Public */}
        <Route path="/" element={<LandingPage />} />
        <Route path="/pricing" element={<PricingPage />} />
        <Route path="/auth" element={
          <PublicOnlyRoute><AuthPage /></PublicOnlyRoute>
        } />

        {/* Protected */}
        <Route path="/onboarding" element={
          <ProtectedRoute><OnboardingPage /></ProtectedRoute>
        } />
        <Route path="/dashboard" element={
          <ProtectedRoute><DashboardPage /></ProtectedRoute>
        } />
        <Route path="/setup" element={
          <ProtectedRoute><SetupPage /></ProtectedRoute>
        } />
        <Route path="/interview" element={
          <ProtectedRoute><InterviewPage /></ProtectedRoute>
        } />
        <Route path="/results/:sessionId" element={
          <ProtectedRoute><ResultsPage /></ProtectedRoute>
        } />
        <Route path="/history" element={
          <ProtectedRoute><HistoryPage /></ProtectedRoute>
        } />
        <Route path="/leaderboard" element={
          <ProtectedRoute><LeaderboardPage /></ProtectedRoute>
        } />

        <Route path="*" element={<Navigate to="/" replace />} />
      </Routes>
    </div>
  )
}