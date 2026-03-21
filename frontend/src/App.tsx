import { BrowserRouter, Routes, Route, Navigate } from 'react-router-dom'
import { useEffect, useState } from 'react'
import LandingPage from './pages/LandingPage'
import LoginPage from './pages/LoginPage'
import RegisterPage from './pages/RegisterPage'
import DashboardPage from './pages/DashboardPage'
import UpgradePage from './pages/UpgradePage'
import SubscriptionPage from './pages/SubscriptionPage'
import OnboardingPage from './pages/OnboardingPage'

interface User {
  id: string
  email: string
  name: string
  plan: string
}

function App() {
  const [user, setUser] = useState<User | null>(null)
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    fetch('/api/auth/me')
      .then(r => r.ok ? r.json() : null)
      .then(data => { setUser(data); setLoading(false) })
      .catch(() => setLoading(false))
  }, [])

  if (loading) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <div className="w-8 h-8 border-4 border-brand-500 border-t-transparent rounded-full animate-spin" />
      </div>
    )
  }

  return (
    <BrowserRouter>
      <Routes>
        <Route path="/" element={<LandingPage user={user} />} />
        <Route path="/entrar" element={user ? <Navigate to="/painel" replace /> : <LoginPage onLogin={setUser} />} />
        <Route path="/cadastro" element={user ? <Navigate to="/painel" replace /> : <RegisterPage onLogin={setUser} />} />
        <Route path="/painel" element={user ? <DashboardPage user={user} onLogout={() => setUser(null)} onUserUpdate={setUser} /> : <Navigate to="/entrar" replace />} />
        <Route path="/upgrade" element={user ? <UpgradePage /> : <Navigate to="/entrar" replace />} />
        <Route path="/assinatura" element={user ? <SubscriptionPage /> : <Navigate to="/entrar" replace />} />
        <Route path="/onboarding" element={user ? <OnboardingPage /> : <Navigate to="/entrar" replace />} />
        <Route path="*" element={<Navigate to="/" replace />} />
      </Routes>
    </BrowserRouter>
  )
}

export default App
