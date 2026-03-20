import { useState, FormEvent } from 'react'
import { Link } from 'react-router-dom'
import { Zap, Eye, EyeOff, Check } from 'lucide-react'

interface Props {
  onLogin: (user: { id: string; email: string; name: string; plan: string }) => void
}

export default function RegisterPage({ onLogin }: Props) {
  const [name, setName] = useState('')
  const [email, setEmail] = useState('')
  const [password, setPassword] = useState('')
  const [showPass, setShowPass] = useState(false)
  const [error, setError] = useState('')
  const [loading, setLoading] = useState(false)

  const passwordStrong = password.length >= 8

  async function handleSubmit(e: FormEvent) {
    e.preventDefault()
    setError('')
    if (!passwordStrong) { setError('A senha deve ter pelo menos 8 caracteres.'); return }
    setLoading(true)
    try {
      const r = await fetch('/api/auth/register', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ name, email, password }),
      })
      const data = await r.json()
      if (!r.ok) { setError(data.error || 'Erro ao criar conta'); return }
      onLogin(data.user)
    } catch {
      setError('Erro de conexão. Tente novamente.')
    } finally {
      setLoading(false)
    }
  }

  return (
    <div className="min-h-screen bg-gradient-to-br from-brand-50 to-white flex items-center justify-center px-6 py-12">
      <div className="w-full max-w-md">
        <div className="text-center mb-8">
          <Link to="/" className="inline-flex items-center gap-2 mb-6">
            <div className="w-8 h-8 bg-brand-600 rounded-lg flex items-center justify-center">
              <Zap className="w-4 h-4 text-white" />
            </div>
            <span className="font-bold text-gray-900 text-lg">Locaweb Start</span>
          </Link>
          <h1 className="text-2xl font-bold text-gray-900">Crie sua conta grátis</h1>
          <p className="text-gray-500 mt-1">Seu site fica pronto em menos de 2 minutos</p>
        </div>

        <div className="bg-white rounded-2xl shadow-sm border border-gray-100 p-8">
          <form onSubmit={handleSubmit} className="space-y-5">
            {error && (
              <div className="bg-red-50 border border-red-200 text-red-700 text-sm px-4 py-3 rounded-xl">
                {error}
              </div>
            )}
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1.5">Seu nome</label>
              <input
                type="text"
                value={name}
                onChange={e => setName(e.target.value)}
                required
                placeholder="João Silva"
                className="w-full px-4 py-3 border border-gray-200 rounded-xl text-sm focus:outline-none focus:ring-2 focus:ring-brand-500 focus:border-transparent transition"
              />
            </div>
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1.5">E-mail</label>
              <input
                type="email"
                value={email}
                onChange={e => setEmail(e.target.value)}
                required
                placeholder="seu@email.com.br"
                className="w-full px-4 py-3 border border-gray-200 rounded-xl text-sm focus:outline-none focus:ring-2 focus:ring-brand-500 focus:border-transparent transition"
              />
            </div>
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1.5">Senha</label>
              <div className="relative">
                <input
                  type={showPass ? 'text' : 'password'}
                  value={password}
                  onChange={e => setPassword(e.target.value)}
                  required
                  placeholder="Mínimo 8 caracteres"
                  className="w-full px-4 py-3 border border-gray-200 rounded-xl text-sm focus:outline-none focus:ring-2 focus:ring-brand-500 focus:border-transparent transition pr-12"
                />
                <button type="button" onClick={() => setShowPass(!showPass)} className="absolute right-4 top-1/2 -translate-y-1/2 text-gray-400 hover:text-gray-600">
                  {showPass ? <EyeOff className="w-4 h-4" /> : <Eye className="w-4 h-4" />}
                </button>
              </div>
              {password.length > 0 && (
                <div className={`flex items-center gap-1.5 mt-2 text-xs ${passwordStrong ? 'text-green-600' : 'text-red-500'}`}>
                  <Check className="w-3 h-3" />
                  {passwordStrong ? 'Senha segura' : 'Muito curta (mínimo 8 caracteres)'}
                </div>
              )}
            </div>
            <button
              type="submit"
              disabled={loading}
              className="w-full bg-brand-600 text-white py-3 rounded-xl font-semibold hover:bg-brand-700 transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
            >
              {loading ? 'Criando conta...' : 'Criar conta grátis'}
            </button>
          </form>
          <p className="text-xs text-gray-400 text-center mt-4">
            Ao criar sua conta você concorda com nossos termos de uso e política de privacidade.
          </p>
        </div>

        <p className="text-center text-sm text-gray-500 mt-6">
          Já tem conta?{' '}
          <Link to="/entrar" className="text-brand-600 font-medium hover:underline">
            Entrar
          </Link>
        </p>
      </div>
    </div>
  )
}
