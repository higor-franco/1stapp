import { useEffect, useState } from 'react'
import { useNavigate } from 'react-router-dom'

interface OctadeskData {
  widget_code: string
  whatsapp_number: string
  active: boolean
}

const empty: OctadeskData = { widget_code: '', whatsapp_number: '', active: false }

export default function OctadeskPage({ userPlan }: { userPlan: string }) {
  const navigate = useNavigate()
  const [data, setData] = useState<OctadeskData>(empty)
  const [loading, setLoading] = useState(true)
  const [saving, setSaving] = useState(false)
  const [success, setSuccess] = useState(false)
  const [error, setError] = useState('')

  useEffect(() => {
    fetch('/api/octadesk')
      .then(r => r.json())
      .then(d => { if (d) setData({ ...empty, ...d }) })
      .catch(() => {})
      .finally(() => setLoading(false))
  }, [])

  async function handleSave(e: React.FormEvent) {
    e.preventDefault()
    setError('')
    setSuccess(false)
    setSaving(true)
    try {
      const res = await fetch('/api/octadesk', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(data),
      })
      const json = await res.json()
      if (!res.ok) { setError(json.error || 'Erro ao salvar'); return }
      setData({ ...empty, ...json })
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
        <div className="w-12 h-12 bg-green-100 rounded-2xl flex items-center justify-center mb-4">
          <svg className="w-6 h-6 text-green-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M8 12h.01M12 12h.01M16 12h.01M21 12c0 4.418-4.03 8-9 8a9.863 9.863 0 01-4.255-.949L3 20l1.395-3.72C3.512 15.042 3 13.574 3 12c0-4.418 4.03-8 9-8s9 3.582 9 8z" />
          </svg>
        </div>
        <h2 className="text-lg font-bold text-gray-900 mb-2">Recurso exclusivo do Plano Start</h2>
        <p className="text-sm text-gray-500 mb-5 max-w-xs">
          Adicione atendimento via WhatsApp Oficial (Octadesk) ao seu site.
        </p>
        <button onClick={() => navigate('/upgrade')} className="bg-blue-600 hover:bg-blue-700 text-white font-semibold text-sm px-5 py-2.5 rounded-xl">
          Fazer upgrade para o Plano Start
        </button>
      </div>
    )
  }

  if (loading) {
    return <div className="flex justify-center py-12"><div className="animate-spin w-6 h-6 border-2 border-blue-600 border-t-transparent rounded-full" /></div>
  }

  return (
    <div className="max-w-xl">
      <h2 className="text-lg font-bold text-gray-900 mb-1">Atendimento WhatsApp (Octadesk)</h2>
      <p className="text-sm text-gray-500 mb-6">
        Integre o widget de atendimento Octadesk no seu site para receber mensagens via WhatsApp Oficial.
      </p>

      {/* Instructions */}
      <div className="bg-green-50 border border-green-100 rounded-xl p-4 mb-6">
        <p className="text-sm font-semibold text-green-800 mb-2">Como configurar:</p>
        <ol className="list-decimal list-inside space-y-2 text-sm text-green-700">
          <li>
            Crie ou acesse sua conta em{' '}
            <a href="https://www.octadesk.com" target="_blank" rel="noopener" className="underline font-medium">
              octadesk.com
            </a>
          </li>
          <li>Configure seu número de <strong>WhatsApp Business Oficial</strong> na Octadesk</li>
          <li>
            No painel Octadesk, vá em <strong>Configurações → Widget</strong> e copie o código de instalação
          </li>
          <li>Cole o código abaixo e ative o widget</li>
        </ol>
        <a
          href="https://www.octadesk.com"
          target="_blank"
          rel="noopener"
          className="mt-3 inline-block bg-green-600 hover:bg-green-700 text-white text-sm font-semibold px-4 py-2 rounded-lg"
        >
          Criar conta na Octadesk →
        </a>
      </div>

      <form onSubmit={handleSave} className="space-y-5">
        {/* Widget code */}
        <div>
          <label className="block text-sm font-medium text-gray-700 mb-1">
            Código do widget Octadesk
          </label>
          <textarea
            value={data.widget_code}
            onChange={e => setData(d => ({ ...d, widget_code: e.target.value }))}
            placeholder={`<script>\n  // Cole aqui o código do widget fornecido pela Octadesk\n</script>`}
            rows={6}
            className="w-full border border-gray-300 rounded-lg px-3 py-2.5 text-xs font-mono focus:outline-none focus:ring-2 focus:ring-blue-500 resize-none"
          />
          <p className="text-xs text-gray-400 mt-1">
            Este código será injetado automaticamente no seu site publicado.
          </p>
        </div>

        {/* WhatsApp number */}
        <div>
          <label className="block text-sm font-medium text-gray-700 mb-1">
            Número de WhatsApp (para exibir na Página Bio)
          </label>
          <div className="relative">
            <span className="absolute left-3 top-1/2 -translate-y-1/2 text-sm text-gray-400">💬</span>
            <input
              value={data.whatsapp_number}
              onChange={e => setData(d => ({ ...d, whatsapp_number: e.target.value }))}
              placeholder="(11) 99999-9999"
              inputMode="tel"
              className="w-full border border-gray-300 rounded-lg pl-9 pr-3 py-2.5 text-sm focus:outline-none focus:ring-2 focus:ring-blue-500"
            />
          </div>
        </div>

        {/* Toggle active */}
        <div className="flex items-center justify-between p-4 bg-gray-50 rounded-xl border border-gray-200">
          <div>
            <p className="text-sm font-medium text-gray-800">Ativar widget no meu site</p>
            <p className="text-xs text-gray-500 mt-0.5">
              O widget será injetado no seu site publicado
            </p>
          </div>
          <button
            type="button"
            onClick={() => setData(d => ({ ...d, active: !d.active }))}
            className={`relative inline-flex h-6 w-11 items-center rounded-full transition-colors ${data.active ? 'bg-green-500' : 'bg-gray-300'}`}
          >
            <span className={`inline-block h-4 w-4 transform rounded-full bg-white transition-transform ${data.active ? 'translate-x-6' : 'translate-x-1'}`} />
          </button>
        </div>

        {/* Status indicator */}
        {data.active && data.widget_code && (
          <div className="flex items-center gap-2 bg-green-50 border border-green-200 rounded-xl px-4 py-3">
            <span className="w-2 h-2 bg-green-500 rounded-full animate-pulse shrink-0" />
            <p className="text-sm text-green-700 font-medium">Widget ativo no seu site</p>
          </div>
        )}

        {error && <div className="bg-red-50 border border-red-200 text-red-700 text-sm rounded-lg px-4 py-3">{error}</div>}
        {success && (
          <div className="bg-green-50 border border-green-200 text-green-700 text-sm rounded-lg px-4 py-3">
            Configuração salva! {data.active ? 'O widget foi ativado no seu site.' : 'O widget foi desativado.'}
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
