import { useState } from 'react'
import { Zap, Globe, Sparkles, LogOut, ChevronRight } from 'lucide-react'

interface User {
  id: string
  email: string
  name: string
  plan: string
}

interface Props {
  user: User
  onLogout: () => void
}

export default function DashboardPage({ user, onLogout }: Props) {
  const [loggingOut, setLoggingOut] = useState(false)

  async function handleLogout() {
    setLoggingOut(true)
    await fetch('/api/auth/logout', { method: 'POST' })
    onLogout()
  }

  return (
    <div className="min-h-screen bg-gray-50">
      {/* Sidebar */}
      <aside className="fixed left-0 top-0 h-full w-64 bg-white border-r border-gray-100 flex flex-col">
        <div className="p-6 border-b border-gray-100">
          <div className="flex items-center gap-2">
            <div className="w-7 h-7 bg-brand-600 rounded-lg flex items-center justify-center">
              <Zap className="w-3.5 h-3.5 text-white" />
            </div>
            <span className="font-bold text-gray-900">Locaweb Start</span>
          </div>
        </div>

        <nav className="flex-1 p-4 space-y-1">
          {[
            { label: 'Meu Site', icon: Globe, active: true },
            { label: 'Minha Logo', icon: Sparkles, active: false },
          ].map(item => (
            <button
              key={item.label}
              className={`w-full flex items-center gap-3 px-4 py-2.5 rounded-xl text-sm font-medium transition-colors ${
                item.active ? 'bg-brand-50 text-brand-700' : 'text-gray-500 hover:bg-gray-50 hover:text-gray-900'
              }`}
            >
              <item.icon className="w-4 h-4" />
              {item.label}
            </button>
          ))}
        </nav>

        <div className="p-4 border-t border-gray-100">
          <div className="flex items-center gap-3 mb-3">
            <div className="w-8 h-8 bg-brand-100 rounded-full flex items-center justify-center">
              <span className="text-brand-700 text-xs font-bold">{user.name[0].toUpperCase()}</span>
            </div>
            <div className="flex-1 min-w-0">
              <p className="text-sm font-medium text-gray-900 truncate">{user.name}</p>
              <p className="text-xs text-gray-400 capitalize">{user.plan === 'free' ? 'Plano Free' : 'Plano Start'}</p>
            </div>
          </div>
          <button
            onClick={handleLogout}
            disabled={loggingOut}
            className="w-full flex items-center gap-2 px-3 py-2 text-xs text-gray-500 hover:text-red-600 hover:bg-red-50 rounded-lg transition-colors"
          >
            <LogOut className="w-3.5 h-3.5" />
            Sair
          </button>
        </div>
      </aside>

      {/* Main */}
      <main className="pl-64 p-8">
        <div className="max-w-3xl mx-auto">
          <div className="mb-8">
            <h1 className="text-2xl font-bold text-gray-900">Olá, {user.name.split(' ')[0]}! 👋</h1>
            <p className="text-gray-500 mt-1">Vamos criar o site do seu negócio.</p>
          </div>

          {/* CTA criar site */}
          <div className="bg-gradient-to-br from-brand-600 to-brand-800 rounded-2xl p-8 text-white mb-6">
            <h2 className="text-xl font-bold mb-2">Crie seu site agora</h2>
            <p className="text-brand-100 text-sm mb-6">
              Descreva seu negócio em português e a IA gera um site profissional em segundos.
            </p>
            <button className="bg-white text-brand-700 px-6 py-3 rounded-xl font-semibold text-sm hover:bg-brand-50 transition-colors flex items-center gap-2">
              Criar meu site
              <ChevronRight className="w-4 h-4" />
            </button>
          </div>

          {/* Upgrade banner (free only) */}
          {user.plan === 'free' && (
            <div className="bg-amber-50 border border-amber-200 rounded-2xl p-6 flex items-center justify-between">
              <div>
                <p className="font-semibold text-amber-900">Faça upgrade para o Plano Start</p>
                <p className="text-amber-700 text-sm mt-1">Domínio próprio, SEO avançado, Página Bio, WhatsApp e muito mais.</p>
              </div>
              <button className="bg-amber-500 text-white px-5 py-2.5 rounded-xl font-semibold text-sm hover:bg-amber-600 transition-colors shrink-0 ml-4">
                Fazer upgrade
              </button>
            </div>
          )}
        </div>
      </main>
    </div>
  )
}
