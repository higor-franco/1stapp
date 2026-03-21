import { useEffect, useState } from 'react'
import { useNavigate } from 'react-router-dom'

interface SubscriptionData {
  plan: string
  status: string
  current_period_end?: string
  invoices: Invoice[]
}

interface Invoice {
  id: number
  amount: number
  status: string
  due_at?: string
  paid_at?: string
}

function formatBRL(cents: number) {
  return new Intl.NumberFormat('pt-BR', { style: 'currency', currency: 'BRL' }).format(cents / 100)
}

function formatDate(iso?: string) {
  if (!iso) return '—'
  return new Date(iso).toLocaleDateString('pt-BR')
}

const statusLabel: Record<string, { label: string; color: string }> = {
  active: { label: 'Ativa', color: 'text-green-700 bg-green-50' },
  inactive: { label: 'Inativa', color: 'text-gray-600 bg-gray-100' },
  canceled: { label: 'Cancelada', color: 'text-red-700 bg-red-50' },
  past_due: { label: 'Pagamento pendente', color: 'text-yellow-700 bg-yellow-50' },
}

const invoiceStatusLabel: Record<string, { label: string; color: string }> = {
  paid: { label: 'Pago', color: 'text-green-700 bg-green-50' },
  pending: { label: 'Pendente', color: 'text-yellow-700 bg-yellow-50' },
  canceled: { label: 'Cancelado', color: 'text-red-700 bg-red-50' },
}

export default function SubscriptionPage() {
  const navigate = useNavigate()
  const [data, setData] = useState<SubscriptionData | null>(null)
  const [loading, setLoading] = useState(true)
  const [canceling, setCanceling] = useState(false)
  const [confirmCancel, setConfirmCancel] = useState(false)
  const [error, setError] = useState('')

  useEffect(() => {
    fetch('/api/subscription/me')
      .then(r => r.json())
      .then(setData)
      .catch(() => setError('Erro ao carregar dados'))
      .finally(() => setLoading(false))
  }, [])

  async function handleCancel() {
    setCanceling(true)
    setError('')
    try {
      const res = await fetch('/api/subscription/cancel', { method: 'POST' })
      const json = await res.json()
      if (!res.ok) {
        setError(json.error || 'Erro ao cancelar')
        return
      }
      setData(d => d ? { ...d, plan: 'free', status: 'canceled' } : d)
      setConfirmCancel(false)
    } catch {
      setError('Erro de conexão')
    } finally {
      setCanceling(false)
    }
  }

  if (loading) {
    return (
      <div className="min-h-screen bg-gray-50 flex items-center justify-center">
        <div className="animate-spin w-6 h-6 border-2 border-blue-600 border-t-transparent rounded-full" />
      </div>
    )
  }

  const sub = data!
  const isPaid = sub.plan === 'start'
  const statusInfo = statusLabel[sub.status] ?? { label: sub.status, color: 'text-gray-600 bg-gray-100' }

  return (
    <div className="min-h-screen bg-gray-50 p-4 sm:p-8">
      <div className="max-w-2xl mx-auto">
        <button onClick={() => navigate('/painel')} className="text-sm text-gray-500 hover:text-gray-700 mb-6 flex items-center gap-1">
          ← Voltar ao painel
        </button>

        <h1 className="text-2xl font-bold text-gray-900 mb-6">Minha Assinatura</h1>

        {/* Plan card */}
        <div className="bg-white rounded-2xl border border-gray-200 shadow-sm p-6 mb-6">
          <div className="flex items-start justify-between">
            <div>
              <p className="text-sm text-gray-500 mb-1">Plano atual</p>
              <p className="text-xl font-bold text-gray-900">{isPaid ? 'Plano Start' : 'Plano Free'}</p>
            </div>
            <span className={`text-xs font-semibold px-2.5 py-1 rounded-full ${statusInfo.color}`}>
              {statusInfo.label}
            </span>
          </div>

          {isPaid && sub.current_period_end && (
            <p className="text-sm text-gray-500 mt-3">
              Próxima cobrança em <strong>{formatDate(sub.current_period_end)}</strong>
            </p>
          )}

          {!isPaid && (
            <div className="mt-4">
              <button
                onClick={() => navigate('/upgrade')}
                className="bg-blue-600 hover:bg-blue-700 text-white text-sm font-semibold px-4 py-2 rounded-lg"
              >
                Fazer upgrade para o Plano Start
              </button>
            </div>
          )}

          {isPaid && sub.status !== 'canceled' && (
            <div className="mt-5 pt-5 border-t border-gray-100">
              {!confirmCancel ? (
                <button
                  onClick={() => setConfirmCancel(true)}
                  className="text-sm text-red-600 hover:text-red-700"
                >
                  Cancelar assinatura
                </button>
              ) : (
                <div className="bg-red-50 border border-red-200 rounded-xl p-4">
                  <p className="text-sm text-red-700 font-medium mb-3">
                    Tem certeza? Você perderá acesso às funcionalidades do Plano Start imediatamente.
                  </p>
                  <div className="flex gap-3">
                    <button
                      onClick={handleCancel}
                      disabled={canceling}
                      className="bg-red-600 hover:bg-red-700 disabled:bg-red-400 text-white text-sm font-semibold px-4 py-2 rounded-lg"
                    >
                      {canceling ? 'Cancelando...' : 'Confirmar cancelamento'}
                    </button>
                    <button
                      onClick={() => setConfirmCancel(false)}
                      className="text-sm text-gray-600 hover:text-gray-800 px-4 py-2"
                    >
                      Manter assinatura
                    </button>
                  </div>
                </div>
              )}
            </div>
          )}
        </div>

        {/* Invoices */}
        <div className="bg-white rounded-2xl border border-gray-200 shadow-sm p-6">
          <h2 className="font-semibold text-gray-900 mb-4">Histórico de faturas</h2>

          {sub.invoices.length === 0 ? (
            <p className="text-sm text-gray-400">Nenhuma fatura encontrada.</p>
          ) : (
            <div className="divide-y divide-gray-100">
              {sub.invoices.map(inv => {
                const st = invoiceStatusLabel[inv.status] ?? { label: inv.status, color: 'text-gray-600 bg-gray-100' }
                return (
                  <div key={inv.id} className="flex items-center justify-between py-3">
                    <div>
                      <p className="text-sm font-medium text-gray-800">Plano Start — {formatBRL(inv.amount)}</p>
                      <p className="text-xs text-gray-400">
                        {inv.paid_at ? `Pago em ${formatDate(inv.paid_at)}` : `Vencimento ${formatDate(inv.due_at)}`}
                      </p>
                    </div>
                    <span className={`text-xs font-semibold px-2 py-0.5 rounded-full ${st.color}`}>{st.label}</span>
                  </div>
                )
              })}
            </div>
          )}
        </div>

        {error && (
          <div className="mt-4 bg-red-50 border border-red-200 text-red-700 text-sm rounded-xl px-4 py-3">
            {error}
          </div>
        )}
      </div>
    </div>
  )
}
