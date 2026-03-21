import { useEffect, useState } from 'react'
import { useNavigate } from 'react-router-dom'

interface DnsInstruction {
  type: string
  host: string
  value: string
  ttl: string
}

interface DomainState {
  custom_domain: { string: string; valid: boolean } | null
  slug: string
}

interface VerifyResult {
  domain: string
  propagated: boolean
  ips: string[]
  message: string
}

export default function DomainPage({ userPlan }: { userPlan: string }) {
  const navigate = useNavigate()

  const [state, setState] = useState<DomainState | null>(null)
  const [loading, setLoading] = useState(true)
  const [domainInput, setDomainInput] = useState('')
  const [saving, setSaving] = useState(false)
  const [removing, setRemoving] = useState(false)
  const [verifying, setVerifying] = useState(false)
  const [dnsInstructions, setDnsInstructions] = useState<DnsInstruction[] | null>(null)
  const [verifyResult, setVerifyResult] = useState<VerifyResult | null>(null)
  const [error, setError] = useState('')
  const [success, setSuccess] = useState('')

  useEffect(() => {
    fetch('/api/domain/me')
      .then(r => r.json())
      .then(data => {
        setState(data)
        if (data?.custom_domain?.valid) {
          setDomainInput(data.custom_domain.string)
        }
      })
      .catch(() => {})
      .finally(() => setLoading(false))
  }, [])

  async function handleConfigure(e: React.FormEvent) {
    e.preventDefault()
    setError('')
    setSuccess('')
    setSaving(true)
    try {
      const res = await fetch('/api/domain/configure', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ domain: domainInput }),
      })
      const data = await res.json()
      if (!res.ok) { setError(data.error || 'Erro ao configurar'); return }
      setState(s => s ? { ...s, custom_domain: data.custom_domain } : s)
      setDnsInstructions(data.dns_instructions)
      setSuccess(`Domínio "${data.custom_domain?.string}" configurado! Agora configure o DNS conforme abaixo.`)
    } catch {
      setError('Erro de conexão')
    } finally {
      setSaving(false)
    }
  }

  async function handleRemove() {
    if (!confirm('Remover o domínio personalizado?')) return
    setRemoving(true)
    setError('')
    setSuccess('')
    try {
      const res = await fetch('/api/domain/configure', { method: 'DELETE' })
      if (!res.ok) { setError('Erro ao remover'); return }
      setState(s => s ? { ...s, custom_domain: null } : s)
      setDomainInput('')
      setDnsInstructions(null)
      setVerifyResult(null)
      setSuccess('Domínio removido.')
    } catch {
      setError('Erro de conexão')
    } finally {
      setRemoving(false)
    }
  }

  async function handleVerify() {
    setVerifying(true)
    setVerifyResult(null)
    try {
      const res = await fetch('/api/domain/verify')
      const data = await res.json()
      setVerifyResult(data)
    } catch {
      setError('Erro de conexão')
    } finally {
      setVerifying(false)
    }
  }

  if (userPlan !== 'start') {
    return (
      <div className="flex flex-col items-center justify-center py-16 text-center px-4">
        <div className="w-12 h-12 bg-indigo-100 rounded-2xl flex items-center justify-center mb-4">
          <svg className="w-6 h-6 text-indigo-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M21 12a9 9 0 01-9 9m9-9a9 9 0 00-9-9m9 9H3m9 9a9 9 0 01-9-9m9 9c1.657 0 3-4.03 3-9s-1.343-9-3-9m0 18c-1.657 0-3-4.03-3-9s1.343-9 3-9m-9 9a9 9 0 019-9" />
          </svg>
        </div>
        <h2 className="text-lg font-bold text-gray-900 mb-2">Recurso exclusivo do Plano Start</h2>
        <p className="text-sm text-gray-500 mb-5 max-w-xs">
          Use seu próprio domínio (ex: www.meusite.com.br) no lugar do subdomínio gratuito.
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

  const currentDomain = state?.custom_domain?.valid ? state.custom_domain.string : null
  const subdomainUrl = state?.slug ? `${window.location.origin}/site/${state.slug}` : null

  return (
    <div className="max-w-xl">
      <h2 className="text-lg font-bold text-gray-900 mb-1">Domínio Personalizado</h2>
      <p className="text-sm text-gray-500 mb-6">
        Use seu próprio domínio no lugar do subdomínio gratuito.
        {subdomainUrl && <> Site atual: <a href={subdomainUrl} target="_blank" rel="noopener" className="text-blue-600 underline">{subdomainUrl}</a></>}
      </p>

      {/* Step 1: Buy domain */}
      <div className="bg-white border border-gray-200 rounded-2xl p-5 mb-4">
        <div className="flex items-center gap-3 mb-3">
          <div className="w-7 h-7 bg-blue-100 rounded-full flex items-center justify-center text-sm font-bold text-blue-700">1</div>
          <h3 className="font-semibold text-gray-900">Compre seu domínio na Locaweb</h3>
        </div>
        <p className="text-sm text-gray-500 mb-3">
          Pesquise a disponibilidade do domínio desejado e adquira direto na Locaweb.
        </p>
        <div className="flex gap-2">
          <input
            value={domainInput}
            onChange={e => setDomainInput(e.target.value.toLowerCase())}
            placeholder="meusite.com.br"
            className="flex-1 border border-gray-300 rounded-lg px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-blue-500"
          />
          <a
            href={`https://www.locaweb.com.br/registro-de-dominio/?dominio=${encodeURIComponent(domainInput)}`}
            target="_blank"
            rel="noopener"
            className="bg-blue-600 hover:bg-blue-700 text-white text-sm font-semibold px-4 py-2 rounded-lg whitespace-nowrap"
          >
            Buscar na Locaweb →
          </a>
        </div>
      </div>

      {/* Step 2: Configure */}
      <div className="bg-white border border-gray-200 rounded-2xl p-5 mb-4">
        <div className="flex items-center gap-3 mb-3">
          <div className="w-7 h-7 bg-blue-100 rounded-full flex items-center justify-center text-sm font-bold text-blue-700">2</div>
          <h3 className="font-semibold text-gray-900">Configure o domínio aqui</h3>
        </div>
        <p className="text-sm text-gray-500 mb-3">Após comprar o domínio, informe-o abaixo para associá-lo ao seu site.</p>

        {currentDomain && (
          <div className="flex items-center gap-2 bg-green-50 border border-green-200 rounded-xl px-4 py-3 mb-3">
            <span className="w-2 h-2 bg-green-500 rounded-full shrink-0" />
            <span className="text-sm text-green-800 font-medium flex-1">{currentDomain}</span>
            <button onClick={handleRemove} disabled={removing} className="text-xs text-red-500 hover:text-red-700">
              {removing ? '...' : 'Remover'}
            </button>
          </div>
        )}

        <form onSubmit={handleConfigure} className="flex gap-2">
          <input
            value={domainInput}
            onChange={e => setDomainInput(e.target.value.toLowerCase())}
            placeholder="meusite.com.br"
            required
            className="flex-1 border border-gray-300 rounded-lg px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-blue-500"
          />
          <button
            type="submit"
            disabled={saving}
            className="bg-blue-600 hover:bg-blue-700 disabled:bg-blue-400 text-white text-sm font-semibold px-4 py-2 rounded-lg"
          >
            {saving ? '...' : 'Salvar'}
          </button>
        </form>
      </div>

      {/* Step 3: DNS */}
      {(currentDomain || dnsInstructions) && (
        <div className="bg-white border border-gray-200 rounded-2xl p-5 mb-4">
          <div className="flex items-center gap-3 mb-3">
            <div className="w-7 h-7 bg-blue-100 rounded-full flex items-center justify-center text-sm font-bold text-blue-700">3</div>
            <h3 className="font-semibold text-gray-900">Configure o DNS na Locaweb</h3>
          </div>
          <p className="text-sm text-gray-500 mb-4">
            No painel da Locaweb, acesse <strong>Gerenciador de DNS</strong> do domínio e crie os seguintes registros:
          </p>

          <div className="overflow-x-auto">
            <table className="w-full text-sm border-collapse">
              <thead>
                <tr className="bg-gray-50 text-gray-600 text-xs uppercase">
                  <th className="text-left px-3 py-2 border border-gray-200 rounded-tl-lg">Tipo</th>
                  <th className="text-left px-3 py-2 border border-gray-200">Host</th>
                  <th className="text-left px-3 py-2 border border-gray-200">Valor</th>
                  <th className="text-left px-3 py-2 border border-gray-200 rounded-tr-lg">TTL</th>
                </tr>
              </thead>
              <tbody>
                {(dnsInstructions ?? defaultDnsInstructions()).map((row, i) => (
                  <tr key={i} className="border-b border-gray-100">
                    <td className="px-3 py-2 border border-gray-200 font-mono text-xs font-bold text-blue-700">{row.type}</td>
                    <td className="px-3 py-2 border border-gray-200 font-mono text-xs">{row.host}</td>
                    <td className="px-3 py-2 border border-gray-200 font-mono text-xs break-all">{row.value}</td>
                    <td className="px-3 py-2 border border-gray-200 font-mono text-xs">{row.ttl}</td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>

          <p className="text-xs text-gray-400 mt-3">
            ⏱ A propagação do DNS pode levar de alguns minutos até 48 horas.
          </p>
        </div>
      )}

      {/* Step 4: Verify */}
      {currentDomain && (
        <div className="bg-white border border-gray-200 rounded-2xl p-5 mb-4">
          <div className="flex items-center gap-3 mb-3">
            <div className="w-7 h-7 bg-blue-100 rounded-full flex items-center justify-center text-sm font-bold text-blue-700">4</div>
            <h3 className="font-semibold text-gray-900">Verificar propagação do DNS</h3>
          </div>
          <p className="text-sm text-gray-500 mb-3">
            Clique para verificar se o DNS já propagou para o nosso servidor.
          </p>

          <button
            onClick={handleVerify}
            disabled={verifying}
            className="bg-gray-800 hover:bg-gray-900 disabled:bg-gray-400 text-white text-sm font-semibold px-4 py-2.5 rounded-lg"
          >
            {verifying ? 'Verificando...' : '🔍 Verificar propagação'}
          </button>

          {verifyResult && (
            <div className={`mt-3 rounded-xl px-4 py-3 border ${verifyResult.propagated ? 'bg-green-50 border-green-200' : 'bg-yellow-50 border-yellow-200'}`}>
              <p className={`text-sm font-medium ${verifyResult.propagated ? 'text-green-800' : 'text-yellow-800'}`}>
                {verifyResult.propagated ? '✅' : '⏳'} {verifyResult.message}
              </p>
              {verifyResult.ips.length > 0 && (
                <p className="text-xs text-gray-500 mt-1">IPs resolvidos: {verifyResult.ips.join(', ')}</p>
              )}
            </div>
          )}
        </div>
      )}

      {error && <div className="bg-red-50 border border-red-200 text-red-700 text-sm rounded-xl px-4 py-3 mb-3">{error}</div>}
      {success && <div className="bg-green-50 border border-green-200 text-green-700 text-sm rounded-xl px-4 py-3 mb-3">{success}</div>}
    </div>
  )
}

function defaultDnsInstructions(): DnsInstruction[] {
  return [
    { type: 'A', host: '@', value: 'IP_DO_SERVIDOR', ttl: '3600' },
    { type: 'A', host: 'www', value: 'IP_DO_SERVIDOR', ttl: '3600' },
  ]
}
