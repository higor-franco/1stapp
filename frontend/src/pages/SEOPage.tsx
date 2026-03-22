import { useState, useEffect } from 'react'
import { useNavigate } from 'react-router-dom'
import { Search, Plus, X, BarChart2, Bot, Globe, Loader2, ChevronDown, ChevronUp } from 'lucide-react'

interface SEOConfig {
  keywords: string[]
  competitor_domains: string[]
  data_for_seo_login: string
  data_for_seo_password: string
}

interface KeywordResult {
  keyword: string
  google_rank: number
  llm_mention: boolean
  llm_snippet: string
  rank_error?: string
}

interface SEOReport {
  id: string
  run_at: { Time: string }
  results: KeywordResult[]
}

interface Props {
  userPlan: string
}

export default function SEOPage({ userPlan }: Props) {
  const navigate = useNavigate()
  const [config, setConfig] = useState<SEOConfig>({
    keywords: [],
    competitor_domains: [],
    data_for_seo_login: '',
    data_for_seo_password: '',
  })
  const [newKeyword, setNewKeyword] = useState('')
  const [newDomain, setNewDomain] = useState('')
  const [saving, setSaving] = useState(false)
  const [saveMsg, setSaveMsg] = useState('')
  const [analyzing, setAnalyzing] = useState(false)
  const [analyzeError, setAnalyzeError] = useState('')
  const [reports, setReports] = useState<SEOReport[]>([])
  const [latestReport, setLatestReport] = useState<KeywordResult[] | null>(null)
  const [showHistory, setShowHistory] = useState(false)
  const [showDFSConfig, setShowDFSConfig] = useState(false)

  useEffect(() => {
    fetch('/api/seo/config').then(r => r.json()).then(setConfig).catch(() => {})
    fetch('/api/seo/reports').then(r => r.json()).then((data: SEOReport[]) => {
      setReports(data ?? [])
      if (data && data.length > 0) setLatestReport(data[0].results)
    }).catch(() => {})
  }, [])

  function addKeyword() {
    const kw = newKeyword.trim()
    if (!kw || config.keywords.includes(kw) || config.keywords.length >= 10) return
    setConfig(c => ({ ...c, keywords: [...c.keywords, kw] }))
    setNewKeyword('')
  }

  function removeKeyword(kw: string) {
    setConfig(c => ({ ...c, keywords: c.keywords.filter(k => k !== kw) }))
  }

  function addDomain() {
    const d = newDomain.trim().replace(/^https?:\/\//, '').replace(/\/$/, '')
    if (!d || config.competitor_domains.includes(d) || config.competitor_domains.length >= 5) return
    setConfig(c => ({ ...c, competitor_domains: [...c.competitor_domains, d] }))
    setNewDomain('')
  }

  function removeDomain(d: string) {
    setConfig(c => ({ ...c, competitor_domains: c.competitor_domains.filter(x => x !== d) }))
  }

  async function saveConfig() {
    setSaving(true)
    setSaveMsg('')
    try {
      const r = await fetch('/api/seo/config', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(config),
      })
      if (r.ok) setSaveMsg('Configuração salva!')
      else setSaveMsg('Erro ao salvar.')
    } finally {
      setSaving(false)
      setTimeout(() => setSaveMsg(''), 3000)
    }
  }

  async function runAnalysis() {
    setAnalyzeError('')
    setAnalyzing(true)
    try {
      const r = await fetch('/api/seo/analyze', { method: 'POST' })
      const data = await r.json()
      if (!r.ok) { setAnalyzeError(data.error || 'Erro na análise'); return }
      setLatestReport(data.results)
      setReports(prev => [{ id: data.report_id, run_at: data.run_at, results: data.results }, ...prev.slice(0, 9)])
    } catch {
      setAnalyzeError('Erro de conexão')
    } finally {
      setAnalyzing(false)
    }
  }

  if (userPlan !== 'start') {
    return (
      <div className="max-w-xl mx-auto mt-16 text-center">
        <div className="w-14 h-14 bg-amber-100 rounded-2xl flex items-center justify-center mx-auto mb-4">
          <Search className="w-7 h-7 text-amber-600" />
        </div>
        <h2 className="text-xl font-bold text-gray-900 mb-2">SEO Analytics</h2>
        <p className="text-gray-500 mb-6">Monitore seu posicionamento no Google e presença em IAs como ChatGPT, Claude e Gemini.</p>
        <button onClick={() => navigate('/upgrade')} className="bg-amber-500 hover:bg-amber-600 text-white px-6 py-3 rounded-xl font-semibold">
          Fazer upgrade para o Plano Start
        </button>
      </div>
    )
  }

  return (
    <div className="max-w-3xl mx-auto">
      <div className="mb-6">
        <h1 className="text-2xl font-bold text-gray-900">SEO Analytics</h1>
        <p className="text-gray-500 mt-1 text-sm">Monitore seu posicionamento no Google e presença em IAs.</p>
      </div>

      {/* Keywords */}
      <div className="bg-white border border-gray-200 rounded-2xl p-5 mb-4">
        <h3 className="font-semibold text-gray-900 mb-1 flex items-center gap-2">
          <Search className="w-4 h-4 text-brand-600" />
          Palavras-chave (máx. 10)
        </h3>
        <p className="text-xs text-gray-500 mb-3">Ex: "pizzaria delivery SP", "consultório dentista BH"</p>

        <div className="flex gap-2 mb-3">
          <input
            value={newKeyword}
            onChange={e => setNewKeyword(e.target.value)}
            onKeyDown={e => e.key === 'Enter' && (e.preventDefault(), addKeyword())}
            placeholder="Digite uma palavra-chave e pressione Enter"
            className="flex-1 border border-gray-300 rounded-xl px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-brand-500"
          />
          <button onClick={addKeyword} className="bg-brand-600 hover:bg-brand-700 text-white px-4 py-2 rounded-xl text-sm font-medium">
            <Plus className="w-4 h-4" />
          </button>
        </div>

        <div className="flex flex-wrap gap-2">
          {config.keywords.map(kw => (
            <span key={kw} className="flex items-center gap-1.5 bg-brand-50 text-brand-700 text-xs font-medium px-3 py-1.5 rounded-full">
              {kw}
              <button onClick={() => removeKeyword(kw)} className="hover:text-brand-900">
                <X className="w-3 h-3" />
              </button>
            </span>
          ))}
          {config.keywords.length === 0 && <p className="text-sm text-gray-400">Nenhuma palavra-chave adicionada.</p>}
        </div>
      </div>

      {/* Competitor domains */}
      <div className="bg-white border border-gray-200 rounded-2xl p-5 mb-4">
        <h3 className="font-semibold text-gray-900 mb-1 flex items-center gap-2">
          <Globe className="w-4 h-4 text-gray-500" />
          Domínios concorrentes (máx. 5)
        </h3>
        <p className="text-xs text-gray-500 mb-3">Opcional — compare seu posicionamento com concorrentes.</p>

        <div className="flex gap-2 mb-3">
          <input
            value={newDomain}
            onChange={e => setNewDomain(e.target.value)}
            onKeyDown={e => e.key === 'Enter' && (e.preventDefault(), addDomain())}
            placeholder="exemplo.com.br"
            className="flex-1 border border-gray-300 rounded-xl px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-brand-500"
          />
          <button onClick={addDomain} className="bg-gray-200 hover:bg-gray-300 text-gray-700 px-4 py-2 rounded-xl text-sm font-medium">
            <Plus className="w-4 h-4" />
          </button>
        </div>

        <div className="flex flex-wrap gap-2">
          {config.competitor_domains.map(d => (
            <span key={d} className="flex items-center gap-1.5 bg-gray-100 text-gray-700 text-xs font-medium px-3 py-1.5 rounded-full">
              {d}
              <button onClick={() => removeDomain(d)} className="hover:text-gray-900">
                <X className="w-3 h-3" />
              </button>
            </span>
          ))}
          {config.competitor_domains.length === 0 && <p className="text-sm text-gray-400">Nenhum concorrente adicionado.</p>}
        </div>
      </div>

      {/* DataForSEO (optional, collapsible) */}
      <div className="bg-white border border-gray-200 rounded-2xl mb-4 overflow-hidden">
        <button
          onClick={() => setShowDFSConfig(v => !v)}
          className="w-full flex items-center justify-between px-5 py-4 text-sm font-semibold text-gray-700 hover:bg-gray-50"
        >
          <span className="flex items-center gap-2">
            <BarChart2 className="w-4 h-4 text-gray-400" />
            Integração DataForSEO (opcional)
          </span>
          {showDFSConfig ? <ChevronUp className="w-4 h-4 text-gray-400" /> : <ChevronDown className="w-4 h-4 text-gray-400" />}
        </button>
        {showDFSConfig && (
          <div className="border-t border-gray-100 p-5">
            <p className="text-xs text-gray-500 mb-4">
              Com as credenciais DataForSEO você obtém o rank real no Google por palavra-chave.
              Sem elas, apenas a presença em IAs é verificada.
            </p>
            <div className="grid grid-cols-2 gap-3">
              <div>
                <label className="text-xs font-medium text-gray-700 mb-1 block">Login (e-mail)</label>
                <input
                  value={config.data_for_seo_login}
                  onChange={e => setConfig(c => ({ ...c, data_for_seo_login: e.target.value }))}
                  placeholder="email@exemplo.com"
                  className="w-full border border-gray-300 rounded-xl px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-brand-500"
                />
              </div>
              <div>
                <label className="text-xs font-medium text-gray-700 mb-1 block">Password</label>
                <input
                  type="password"
                  value={config.data_for_seo_password}
                  onChange={e => setConfig(c => ({ ...c, data_for_seo_password: e.target.value }))}
                  placeholder="••••••••"
                  className="w-full border border-gray-300 rounded-xl px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-brand-500"
                />
              </div>
            </div>
          </div>
        )}
      </div>

      {/* Save + Analyze */}
      <div className="flex items-center gap-3 mb-8">
        <button
          onClick={saveConfig}
          disabled={saving}
          className="bg-brand-600 hover:bg-brand-700 disabled:bg-brand-400 text-white px-5 py-2.5 rounded-xl text-sm font-semibold"
        >
          {saving ? 'Salvando...' : 'Salvar configuração'}
        </button>
        <button
          onClick={runAnalysis}
          disabled={analyzing || config.keywords.length === 0}
          className="bg-green-600 hover:bg-green-700 disabled:bg-green-400 text-white px-5 py-2.5 rounded-xl text-sm font-semibold flex items-center gap-2"
        >
          {analyzing ? <><Loader2 className="w-4 h-4 animate-spin" /> Analisando...</> : 'Analisar agora'}
        </button>
        {saveMsg && <span className="text-sm text-green-600 font-medium">{saveMsg}</span>}
        {analyzeError && <span className="text-sm text-red-600">{analyzeError}</span>}
      </div>

      {/* Latest report */}
      {latestReport && latestReport.length > 0 && (
        <div className="mb-6">
          <h3 className="font-semibold text-gray-900 mb-3 flex items-center gap-2">
            <BarChart2 className="w-4 h-4 text-brand-600" />
            Último relatório
          </h3>
          <div className="space-y-3">
            {latestReport.map(item => (
              <div key={item.keyword} className="bg-white border border-gray-200 rounded-2xl p-4">
                <div className="flex items-start justify-between gap-4">
                  <div className="flex-1 min-w-0">
                    <p className="font-medium text-gray-900 text-sm">{item.keyword}</p>
                    {item.llm_snippet && (
                      <p className="text-xs text-gray-500 mt-1 line-clamp-2">{item.llm_snippet}</p>
                    )}
                  </div>
                  <div className="flex items-center gap-3 shrink-0">
                    {/* Google rank */}
                    <div className="text-center">
                      <p className="text-xs text-gray-400 mb-0.5">Google</p>
                      {item.rank_error ? (
                        <span className="text-xs text-red-500">erro</span>
                      ) : item.google_rank === 0 ? (
                        <span className="text-xs text-gray-400">—</span>
                      ) : (
                        <span className={`text-sm font-bold ${item.google_rank <= 3 ? 'text-green-600' : item.google_rank <= 10 ? 'text-amber-600' : 'text-gray-600'}`}>
                          #{item.google_rank}
                        </span>
                      )}
                    </div>
                    {/* LLM presence */}
                    <div className="text-center">
                      <p className="text-xs text-gray-400 mb-0.5 flex items-center gap-1"><Bot className="w-3 h-3" />IA</p>
                      {item.llm_mention ? (
                        <span className="text-xs font-semibold text-green-600">✓ sim</span>
                      ) : (
                        <span className="text-xs text-gray-400">não</span>
                      )}
                    </div>
                  </div>
                </div>
              </div>
            ))}
          </div>
        </div>
      )}

      {/* Report history */}
      {reports.length > 1 && (
        <div className="bg-white border border-gray-200 rounded-2xl overflow-hidden">
          <button
            onClick={() => setShowHistory(v => !v)}
            className="w-full flex items-center justify-between px-5 py-4 text-sm font-semibold text-gray-700 hover:bg-gray-50"
          >
            <span>Histórico de análises ({reports.length})</span>
            {showHistory ? <ChevronUp className="w-4 h-4 text-gray-400" /> : <ChevronDown className="w-4 h-4 text-gray-400" />}
          </button>
          {showHistory && (
            <div className="border-t border-gray-100 divide-y divide-gray-50">
              {reports.map((rep, i) => {
                const dt = rep.run_at?.Time ? new Date(rep.run_at.Time) : null
                const mentions = rep.results?.filter(r => r.llm_mention).length ?? 0
                return (
                  <div key={rep.id} className="px-5 py-3 flex items-center justify-between">
                    <div>
                      <p className="text-sm font-medium text-gray-800">
                        {i === 0 ? 'Mais recente' : dt ? dt.toLocaleDateString('pt-BR', { day: '2-digit', month: 'short', year: 'numeric' }) : 'Análise'}
                      </p>
                      <p className="text-xs text-gray-400">
                        {rep.results?.length ?? 0} keywords · {mentions} mencionadas por IA
                      </p>
                    </div>
                    <button
                      onClick={() => setLatestReport(rep.results)}
                      className="text-xs text-brand-600 hover:text-brand-800 font-medium"
                    >
                      Ver
                    </button>
                  </div>
                )
              })}
            </div>
          )}
        </div>
      )}
    </div>
  )
}
