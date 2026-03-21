import { useEffect, useState } from 'react'
import { useNavigate } from 'react-router-dom'

interface AddonData {
  vindi_api_key: string
  service_name: string
  service_amount: number
  service_type: string
  active: boolean
}

function formatBRL(cents: number) {
  return new Intl.NumberFormat('pt-BR', { style: 'currency', currency: 'BRL' }).format(cents / 100)
}

function parseBRL(display: string): number {
  const cleaned = display.replace(/[^\d]/g, '')
  return parseInt(cleaned, 10) || 0
}

function displayBRL(cents: number): string {
  if (cents === 0) return ''
  return (cents / 100).toFixed(2).replace('.', ',')
}

export default function PaymentAddonPage({ userPlan }: { userPlan: string }) {
  const navigate = useNavigate()

  const [addon, setAddon] = useState<AddonData>({
    vindi_api_key: '',
    service_name: '',
    service_amount: 0,
    service_type: 'one_time',
    active: false,
  })
  const [amountDisplay, setAmountDisplay] = useState('')
  const [loading, setLoading] = useState(true)
  const [saving, setSaving] = useState(false)
  const [success, setSuccess] = useState(false)
  const [error, setError] = useState('')

  useEffect(() => {
    fetch('/api/payment-addon')
      .then(r => r.json())
      .then(data => {
        if (data) {
          setAddon(data)
          setAmountDisplay(displayBRL(data.service_amount))
        }
      })
      .catch(() => {})
      .finally(() => setLoading(false))
  }, [])

  function handleAmountChange(e: React.ChangeEvent<HTMLInputElement>) {
    const raw = parseBRL(e.target.value)
    setAmountDisplay(displayBRL(raw))
    setAddon(a => ({ ...a, service_amount: raw }))
  }

  async function handleSave(e: React.FormEvent) {
    e.preventDefault()
    setError('')
    setSuccess(false)
    setSaving(true)

    try {
      const res = await fetch('/api/payment-addon', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(addon),
      })
      const data = await res.json()
      if (!res.ok) {
        setError(data.error || 'Erro ao salvar')
        return
      }
      setAddon(data)
      setAmountDisplay(displayBRL(data.service_amount))
      setSuccess(true)
    } catch {
      setError('Erro de conexão')
    } finally {
      setSaving(false)
    }
  }

  if (userPlan !== 'start') {
    return (
      <div className="flex flex-col items-center justify-center py-16 text-center px-4">
        <div className="w-12 h-12 bg-yellow-100 rounded-2xl flex items-center justify-center mb-4">
          <svg className="w-6 h-6 text-yellow-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 15v2m-6 4h12a2 2 0 002-2v-6a2 2 0 00-2-2H6a2 2 0 00-2 2v6a2 2 0 002 2zm10-10V7a4 4 0 00-8 0v4h8z" />
          </svg>
        </div>
        <h2 className="text-lg font-bold text-gray-900 mb-2">Recurso exclusivo do Plano Start</h2>
        <p className="text-sm text-gray-500 mb-5 max-w-xs">
          Ative pagamentos direto no seu site e receba dos seus clientes via Vindi.
        </p>
        <button onClick={() => navigate('/upgrade')} className="bg-blue-600 hover:bg-blue-700 text-white font-semibold text-sm px-5 py-2.5 rounded-xl">
          Fazer upgrade para o Plano Start
        </button>
      </div>
    )
  }

  if (loading) {
    return (
      <div className="flex justify-center py-12">
        <div className="animate-spin w-6 h-6 border-2 border-blue-600 border-t-transparent rounded-full" />
      </div>
    )
  }

  return (
    <div className="max-w-xl">
      <h2 className="text-lg font-bold text-gray-900 mb-1">Pagamentos no meu site</h2>
      <p className="text-sm text-gray-500 mb-6">
        Conecte sua conta Vindi e insira um botão de pagamento direto no seu site publicado.
      </p>

      {/* Instructions */}
      <div className="bg-blue-50 border border-blue-100 rounded-xl p-4 mb-6">
        <p className="text-sm font-semibold text-blue-800 mb-2">Como funciona:</p>
        <ol className="list-decimal list-inside space-y-1 text-sm text-blue-700">
          <li>Crie ou acesse sua conta em <a href="https://www.vindi.com.br" target="_blank" rel="noopener" className="underline">vindi.com.br</a></li>
          <li>No painel Vindi, vá em <strong>Configurações → API</strong> e copie sua chave de API</li>
          <li>Cole a chave abaixo, configure seu serviço e ative o botão de pagamento</li>
        </ol>
      </div>

      <form onSubmit={handleSave} className="space-y-5">
        <div>
          <label className="block text-sm font-medium text-gray-700 mb-1">Chave de API Vindi</label>
          <input
            type="password"
            value={addon.vindi_api_key}
            onChange={e => setAddon(a => ({ ...a, vindi_api_key: e.target.value }))}
            placeholder="Sua chave de API da Vindi"
            className="w-full border border-gray-300 rounded-lg px-3 py-2.5 text-sm font-mono focus:outline-none focus:ring-2 focus:ring-blue-500"
          />
          <p className="text-xs text-gray-400 mt-1">Mantenha em branco para usar a chave já salva.</p>
        </div>

        <div>
          <label className="block text-sm font-medium text-gray-700 mb-1">Nome do serviço / produto</label>
          <input
            value={addon.service_name}
            onChange={e => setAddon(a => ({ ...a, service_name: e.target.value }))}
            placeholder="Ex: Consulta de 1h, Produto X..."
            required
            className="w-full border border-gray-300 rounded-lg px-3 py-2.5 text-sm focus:outline-none focus:ring-2 focus:ring-blue-500"
          />
        </div>

        <div className="flex gap-4">
          <div className="flex-1">
            <label className="block text-sm font-medium text-gray-700 mb-1">Valor (R$)</label>
            <div className="relative">
              <span className="absolute left-3 top-1/2 -translate-y-1/2 text-sm text-gray-500">R$</span>
              <input
                value={amountDisplay}
                onChange={handleAmountChange}
                inputMode="numeric"
                placeholder="0,00"
                required
                className="w-full border border-gray-300 rounded-lg pl-9 pr-3 py-2.5 text-sm focus:outline-none focus:ring-2 focus:ring-blue-500"
              />
            </div>
          </div>

          <div className="flex-1">
            <label className="block text-sm font-medium text-gray-700 mb-1">Tipo</label>
            <select
              value={addon.service_type}
              onChange={e => setAddon(a => ({ ...a, service_type: e.target.value }))}
              className="w-full border border-gray-300 rounded-lg px-3 py-2.5 text-sm focus:outline-none focus:ring-2 focus:ring-blue-500 bg-white"
            >
              <option value="one_time">Cobrança única</option>
              <option value="recurring">Recorrente (mensal)</option>
            </select>
          </div>
        </div>

        {/* Preview */}
        {addon.service_name && addon.service_amount > 0 && (
          <div className="bg-gray-50 border border-gray-200 rounded-xl p-4">
            <p className="text-xs text-gray-500 mb-2 font-medium">Preview do botão no site:</p>
            <div className="text-center py-4 bg-white rounded-lg border border-gray-100">
              <p className="font-semibold text-gray-800 mb-1">{addon.service_name}</p>
              <p className="text-lg font-bold text-blue-600 mb-3">{formatBRL(addon.service_amount)}</p>
              <button type="button" className="bg-blue-600 text-white text-sm font-semibold px-6 py-2 rounded-lg">
                Pagar agora
              </button>
            </div>
          </div>
        )}

        {/* Toggle active */}
        <div className="flex items-center justify-between p-4 bg-gray-50 rounded-xl border border-gray-200">
          <div>
            <p className="text-sm font-medium text-gray-800">Exibir botão de pagamento no site</p>
            <p className="text-xs text-gray-500 mt-0.5">O botão será injetado automaticamente no seu site publicado</p>
          </div>
          <button
            type="button"
            onClick={() => setAddon(a => ({ ...a, active: !a.active }))}
            className={`relative inline-flex h-6 w-11 items-center rounded-full transition-colors ${addon.active ? 'bg-blue-600' : 'bg-gray-300'}`}
          >
            <span className={`inline-block h-4 w-4 transform rounded-full bg-white transition-transform ${addon.active ? 'translate-x-6' : 'translate-x-1'}`} />
          </button>
        </div>

        {error && (
          <div className="bg-red-50 border border-red-200 text-red-700 text-sm rounded-lg px-4 py-3">
            {error}
          </div>
        )}

        {success && (
          <div className="bg-green-50 border border-green-200 text-green-700 text-sm rounded-lg px-4 py-3">
            Configurações salvas! O botão foi {addon.active ? 'ativado' : 'desativado'} no seu site.
          </div>
        )}

        <button
          type="submit"
          disabled={saving}
          className="w-full bg-blue-600 hover:bg-blue-700 disabled:bg-blue-400 text-white font-semibold py-3 rounded-xl text-sm transition-colors"
        >
          {saving ? 'Salvando...' : 'Salvar configurações'}
        </button>
      </form>
    </div>
  )
}
