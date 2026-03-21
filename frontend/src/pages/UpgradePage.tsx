import { useState } from 'react'
import { useNavigate } from 'react-router-dom'

const PLAN_PRICE = 'R$ 49,90'

function formatCardNumber(value: string) {
  return value.replace(/\D/g, '').slice(0, 16).replace(/(.{4})/g, '$1 ').trim()
}

function formatExpiry(value: string) {
  const digits = value.replace(/\D/g, '').slice(0, 4)
  if (digits.length >= 3) return digits.slice(0, 2) + '/' + digits.slice(2)
  return digits
}

export default function UpgradePage() {
  const navigate = useNavigate()

  const [form, setForm] = useState({
    holder_name: '',
    card_number: '',
    card_expiration: '',
    card_cvv: '',
  })
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState('')

  function handleChange(e: React.ChangeEvent<HTMLInputElement>) {
    const { name, value } = e.target
    if (name === 'card_number') {
      setForm(f => ({ ...f, card_number: formatCardNumber(value) }))
    } else if (name === 'card_expiration') {
      setForm(f => ({ ...f, card_expiration: formatExpiry(value) }))
    } else if (name === 'card_cvv') {
      setForm(f => ({ ...f, card_cvv: value.replace(/\D/g, '').slice(0, 4) }))
    } else {
      setForm(f => ({ ...f, [name]: value }))
    }
  }

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault()
    setError('')
    setLoading(true)

    try {
      const payload = {
        holder_name: form.holder_name,
        card_number: form.card_number.replace(/\s/g, ''),
        card_expiration: form.card_expiration,
        card_cvv: form.card_cvv,
      }
      const res = await fetch('/api/subscription/upgrade', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(payload),
      })
      const data = await res.json()
      if (!res.ok) {
        setError(data.error || 'Erro ao processar pagamento')
        return
      }
      navigate('/onboarding')
    } catch {
      setError('Erro de conexão. Tente novamente.')
    } finally {
      setLoading(false)
    }
  }

  return (
    <div className="min-h-screen bg-gray-50 flex items-center justify-center p-4">
      <div className="w-full max-w-lg">
        {/* Header */}
        <div className="text-center mb-8">
          <div className="inline-flex items-center justify-center w-14 h-14 bg-blue-600 rounded-2xl mb-4">
            <svg className="w-7 h-7 text-white" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 3v4M3 5h4M6 17v4m-2-2h4m5-16l2.286 6.857L21 12l-5.714 2.143L13 21l-2.286-6.857L5 12l5.714-2.143L13 3z" />
            </svg>
          </div>
          <h1 className="text-2xl font-bold text-gray-900">Assine o Plano Start</h1>
          <p className="text-gray-500 mt-1">Tudo que você precisa para crescer online</p>
        </div>

        {/* Benefits */}
        <div className="bg-blue-50 border border-blue-100 rounded-xl p-4 mb-6">
          <p className="text-sm font-semibold text-blue-700 mb-3">O que você ganha:</p>
          <ul className="space-y-2">
            {[
              'Geração ilimitada de sites e logos com IA',
              'Alteração do site por prompt em linguagem natural',
              'Domínio personalizado',
              'SEO avançado com JSON-LD e llms.txt',
              'Página Bio (Linktree) para Instagram',
              'Widget de atendimento WhatsApp (Octadesk)',
              'Add-on de pagamentos no seu site (Vindi)',
            ].map(b => (
              <li key={b} className="flex items-start gap-2 text-sm text-blue-800">
                <svg className="w-4 h-4 text-blue-500 mt-0.5 shrink-0" fill="currentColor" viewBox="0 0 20 20">
                  <path fillRule="evenodd" d="M16.707 5.293a1 1 0 010 1.414l-8 8a1 1 0 01-1.414 0l-4-4a1 1 0 011.414-1.414L8 12.586l7.293-7.293a1 1 0 011.414 0z" clipRule="evenodd" />
                </svg>
                {b}
              </li>
            ))}
          </ul>
        </div>

        {/* Card form */}
        <div className="bg-white rounded-2xl shadow-sm border border-gray-200 p-6">
          <div className="flex items-center justify-between mb-5">
            <span className="font-semibold text-gray-900">Pagamento mensal</span>
            <span className="text-xl font-bold text-blue-600">{PLAN_PRICE}<span className="text-sm font-normal text-gray-500">/mês</span></span>
          </div>

          <form onSubmit={handleSubmit} className="space-y-4">
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">Nome no cartão</label>
              <input
                name="holder_name"
                value={form.holder_name}
                onChange={handleChange}
                placeholder="JOÃO DA SILVA"
                required
                className="w-full border border-gray-300 rounded-lg px-3 py-2.5 text-sm focus:outline-none focus:ring-2 focus:ring-blue-500"
              />
            </div>

            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">Número do cartão</label>
              <input
                name="card_number"
                value={form.card_number}
                onChange={handleChange}
                placeholder="0000 0000 0000 0000"
                inputMode="numeric"
                required
                className="w-full border border-gray-300 rounded-lg px-3 py-2.5 text-sm font-mono focus:outline-none focus:ring-2 focus:ring-blue-500"
              />
            </div>

            <div className="flex gap-3">
              <div className="flex-1">
                <label className="block text-sm font-medium text-gray-700 mb-1">Validade</label>
                <input
                  name="card_expiration"
                  value={form.card_expiration}
                  onChange={handleChange}
                  placeholder="MM/AA"
                  inputMode="numeric"
                  required
                  className="w-full border border-gray-300 rounded-lg px-3 py-2.5 text-sm font-mono focus:outline-none focus:ring-2 focus:ring-blue-500"
                />
              </div>
              <div className="w-28">
                <label className="block text-sm font-medium text-gray-700 mb-1">CVV</label>
                <input
                  name="card_cvv"
                  value={form.card_cvv}
                  onChange={handleChange}
                  placeholder="123"
                  inputMode="numeric"
                  required
                  className="w-full border border-gray-300 rounded-lg px-3 py-2.5 text-sm font-mono focus:outline-none focus:ring-2 focus:ring-blue-500"
                />
              </div>
            </div>

            {error && (
              <div className="bg-red-50 border border-red-200 text-red-700 text-sm rounded-lg px-4 py-3">
                {error}
              </div>
            )}

            <button
              type="submit"
              disabled={loading}
              className="w-full bg-blue-600 hover:bg-blue-700 disabled:bg-blue-400 text-white font-semibold py-3 rounded-xl transition-colors text-sm"
            >
              {loading ? 'Processando...' : `Assinar por ${PLAN_PRICE}/mês`}
            </button>
          </form>

          <p className="text-xs text-gray-400 text-center mt-4">
            Cobrança recorrente via Vindi. Cancele quando quiser.
          </p>
        </div>

        <button
          onClick={() => navigate(-1)}
          className="w-full mt-4 text-sm text-gray-500 hover:text-gray-700 py-2"
        >
          ← Voltar
        </button>
      </div>
    </div>
  )
}
