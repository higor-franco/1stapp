import { useState, useEffect } from 'react'
import { Sparkles, Download, RefreshCw, Check, Zap } from 'lucide-react'

interface Logo {
  id: string
  svgs: string[]
  selected_index: number
}

interface User {
  id: string
  email: string
  name: string
  plan: string
}

interface Props {
  user: User
}

export default function LogoPage({ user }: Props) {
  const [logo, setLogo] = useState<Logo | null | undefined>(undefined)
  const [generating, setGenerating] = useState(false)
  const [selecting, setSelecting] = useState(false)
  const [error, setError] = useState('')

  // Business info from site (passed via form if no site)
  const [businessName, setBusinessName] = useState('')
  const [businessDescription, setBusinessDescription] = useState('')
  const [showForm, setShowForm] = useState(false)

  useEffect(() => {
    fetch('/api/logos/me')
      .then(r => r.json())
      .then(data => setLogo(data.logo ?? null))
      .catch(() => setLogo(null))

    // Pre-fill from site if available
    fetch('/api/sites/me')
      .then(r => r.json())
      .then(data => {
        if (data.site) {
          setBusinessName(data.site.business_name)
          setBusinessDescription(data.site.business_description)
        } else {
          setShowForm(true)
        }
      })
      .catch(() => setShowForm(true))
  }, [])

  async function handleGenerate() {
    if (!businessName.trim() || !businessDescription.trim()) {
      setShowForm(true)
      return
    }
    setError('')
    setGenerating(true)
    try {
      const r = await fetch('/api/logos/generate', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          business_name: businessName,
          business_description: businessDescription,
        }),
      })
      const data = await r.json()
      if (!r.ok) {
        setError(data.error || 'Erro ao gerar logos')
        return
      }
      setLogo(data.logo)
    } finally {
      setGenerating(false)
    }
  }

  async function handleSelect(index: number) {
    if (!logo) return
    setSelecting(true)
    try {
      const r = await fetch('/api/logos/select', {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ selected_index: index }),
      })
      const data = await r.json()
      if (r.ok) setLogo(data.logo)
    } finally {
      setSelecting(false)
    }
  }

  function downloadSVG(svgContent: string, index: number) {
    const blob = new Blob([svgContent], { type: 'image/svg+xml' })
    const url = URL.createObjectURL(blob)
    const a = document.createElement('a')
    a.href = url
    a.download = `${businessName.replace(/\s+/g, '-').toLowerCase()}-logo-${index + 1}.svg`
    a.click()
    URL.revokeObjectURL(url)
  }

  // Plano Free — upgrade wall
  if (user.plan !== 'start') {
    return (
      <div className="max-w-2xl mx-auto">
        <div className="mb-8">
          <h1 className="text-2xl font-bold text-gray-900">Minha Logo</h1>
          <p className="text-gray-500 mt-1">Crie uma identidade visual profissional com IA.</p>
        </div>
        <div className="bg-gradient-to-br from-purple-600 to-purple-900 rounded-2xl p-10 text-white text-center">
          <div className="w-16 h-16 bg-white/10 rounded-2xl flex items-center justify-center mx-auto mb-5">
            <Sparkles className="w-8 h-8 text-purple-200" />
          </div>
          <h2 className="text-2xl font-bold mb-3">Logo com IA — Plano Start</h2>
          <p className="text-purple-200 mb-6 max-w-md mx-auto text-sm leading-relaxed">
            O Claude gera 3 opções de logo em SVG vetorial para o seu negócio.
            Escolha a que mais combina e baixe gratuitamente.
          </p>
          <div className="flex flex-col items-center gap-3 mb-8">
            {[
              '3 opções de logo geradas por IA',
              'Formato SVG vetorial (escala infinita)',
              'Download ilimitado',
            ].map(f => (
              <div key={f} className="flex items-center gap-2 text-sm text-purple-100">
                <Check className="w-4 h-4 text-purple-300" />
                {f}
              </div>
            ))}
          </div>
          <button className="bg-white text-purple-700 px-8 py-3 rounded-xl font-semibold hover:bg-purple-50 transition flex items-center gap-2 mx-auto">
            <Zap className="w-4 h-4" />
            Fazer upgrade para o Plano Start
          </button>
        </div>
      </div>
    )
  }

  // Loading
  if (logo === undefined) {
    return (
      <div className="max-w-3xl mx-auto">
        <div className="mb-8">
          <div className="h-7 bg-gray-100 rounded w-40 animate-pulse mb-2" />
          <div className="h-4 bg-gray-100 rounded w-64 animate-pulse" />
        </div>
        <div className="grid grid-cols-3 gap-4">
          {[1, 2, 3].map(i => (
            <div key={i} className="bg-gray-100 rounded-2xl h-40 animate-pulse" />
          ))}
        </div>
      </div>
    )
  }

  return (
    <div className="max-w-3xl mx-auto">
      <div className="flex items-start justify-between mb-8">
        <div>
          <h1 className="text-2xl font-bold text-gray-900">Minha Logo</h1>
          <p className="text-gray-500 mt-1 text-sm">
            {logo ? 'Selecione a opção preferida e baixe em SVG.' : 'Gere 3 opções de logo com IA para o seu negócio.'}
          </p>
        </div>
        {logo && (
          <button
            onClick={handleGenerate}
            disabled={generating}
            className="flex items-center gap-2 px-4 py-2 border border-gray-200 rounded-xl text-sm font-medium text-gray-600 hover:bg-gray-50 transition disabled:opacity-50"
          >
            <RefreshCw className={`w-4 h-4 ${generating ? 'animate-spin' : ''}`} />
            {generating ? 'Gerando...' : 'Gerar novamente'}
          </button>
        )}
      </div>

      {error && (
        <div className="mb-6 bg-red-50 border border-red-200 text-red-700 text-sm px-4 py-3 rounded-xl">
          {error}
        </div>
      )}

      {/* Form for manual input (when no site exists) */}
      {showForm && !logo && (
        <div className="bg-white rounded-2xl border border-gray-100 p-6 mb-6 space-y-4">
          <p className="text-sm text-gray-500">Preencha as informações do seu negócio para gerar a logo:</p>
          <div>
            <label className="block text-sm font-semibold text-gray-700 mb-1.5">Nome do negócio</label>
            <input
              type="text"
              value={businessName}
              onChange={e => setBusinessName(e.target.value)}
              placeholder="Ex: Studio Foto Arte"
              className="w-full px-4 py-3 border border-gray-200 rounded-xl text-sm focus:outline-none focus:ring-2 focus:ring-brand-500 transition"
            />
          </div>
          <div>
            <label className="block text-sm font-semibold text-gray-700 mb-1.5">Descrição do negócio</label>
            <textarea
              value={businessDescription}
              onChange={e => setBusinessDescription(e.target.value)}
              rows={3}
              placeholder="Descreva brevemente o que seu negócio faz..."
              className="w-full px-4 py-3 border border-gray-200 rounded-xl text-sm focus:outline-none focus:ring-2 focus:ring-brand-500 transition resize-none"
            />
          </div>
        </div>
      )}

      {/* Empty state */}
      {!logo && !generating && (
        <div className="bg-white rounded-2xl border border-gray-100 p-12 text-center">
          <div className="w-16 h-16 bg-purple-50 rounded-2xl flex items-center justify-center mx-auto mb-5">
            <Sparkles className="w-8 h-8 text-purple-600" />
          </div>
          <h2 className="text-lg font-bold text-gray-900 mb-2">Crie sua logo com IA</h2>
          <p className="text-gray-500 text-sm mb-6 max-w-sm mx-auto">
            O Claude vai criar 3 opções de logo vetorial personalizadas para o seu negócio.
          </p>
          <button
            onClick={handleGenerate}
            disabled={!businessName.trim() || !businessDescription.trim()}
            className="inline-flex items-center gap-2 bg-purple-600 text-white px-6 py-3 rounded-xl font-semibold hover:bg-purple-700 transition disabled:opacity-40 disabled:cursor-not-allowed shadow-md shadow-purple-200"
          >
            <Sparkles className="w-4 h-4" />
            Gerar minha logo
          </button>
        </div>
      )}

      {/* Generating state */}
      {generating && (
        <div className="bg-white rounded-2xl border border-gray-100 p-12 text-center">
          <div className="w-16 h-16 bg-purple-50 rounded-full flex items-center justify-center mx-auto mb-5">
            <Sparkles className="w-8 h-8 text-purple-600 animate-pulse" />
          </div>
          <h2 className="text-lg font-bold text-gray-900 mb-2">Criando suas logos...</h2>
          <p className="text-gray-500 text-sm mb-6">
            O Claude está desenvolvendo 3 opções únicas para <strong>{businessName}</strong>.
          </p>
          <div className="space-y-2 text-left bg-gray-50 rounded-xl p-4 max-w-xs mx-auto">
            {[
              'Analisando seu negócio...',
              'Criando conceitos visuais...',
              'Desenhando logos em SVG...',
            ].map((msg, i) => (
              <div key={i} className="flex items-center gap-2 text-sm text-gray-600">
                <div
                  className="w-1.5 h-1.5 rounded-full bg-purple-400 animate-pulse"
                  style={{ animationDelay: `${i * 0.4}s` }}
                />
                {msg}
              </div>
            ))}
          </div>
        </div>
      )}

      {/* Logo options */}
      {logo && !generating && (
        <>
          <div className="grid grid-cols-1 md:grid-cols-3 gap-4 mb-6">
            {logo.svgs.map((svg, i) => (
              <LogoCard
                key={i}
                svg={svg}
                index={i}
                selected={logo.selected_index === i}
                onSelect={() => handleSelect(i)}
                onDownload={() => downloadSVG(svg, i)}
                selecting={selecting}
              />
            ))}
          </div>

          {/* Selected logo download bar */}
          <div className="bg-purple-50 border border-purple-100 rounded-2xl px-6 py-4 flex items-center justify-between">
            <div>
              <p className="text-sm font-semibold text-purple-900">
                Logo {logo.selected_index + 1} selecionada
              </p>
              <p className="text-xs text-purple-600 mt-0.5">Formato SVG vetorial — escala para qualquer tamanho</p>
            </div>
            <button
              onClick={() => downloadSVG(logo.svgs[logo.selected_index], logo.selected_index)}
              className="flex items-center gap-2 bg-purple-600 text-white px-5 py-2.5 rounded-xl text-sm font-semibold hover:bg-purple-700 transition shadow-sm"
            >
              <Download className="w-4 h-4" />
              Baixar SVG
            </button>
          </div>
        </>
      )}
    </div>
  )
}

// ---- Logo Card ----
function LogoCard({
  svg,
  index,
  selected,
  onSelect,
  onDownload,
  selecting,
}: {
  svg: string
  index: number
  selected: boolean
  onSelect: () => void
  onDownload: () => void
  selecting: boolean
}) {
  return (
    <div
      className={`relative bg-white rounded-2xl border-2 transition-all cursor-pointer group ${
        selected
          ? 'border-purple-500 shadow-lg shadow-purple-100'
          : 'border-gray-100 hover:border-gray-200 hover:shadow-md'
      }`}
      onClick={onSelect}
    >
      {/* Selected badge */}
      {selected && (
        <div className="absolute -top-2.5 -right-2.5 w-6 h-6 bg-purple-600 rounded-full flex items-center justify-center shadow-sm z-10">
          <Check className="w-3.5 h-3.5 text-white" />
        </div>
      )}

      {/* SVG preview */}
      <div className="p-4 bg-gray-50 rounded-t-2xl border-b border-gray-100 flex items-center justify-center" style={{ minHeight: '110px' }}>
        <div
          className="w-full"
          dangerouslySetInnerHTML={{ __html: svg }}
          style={{ maxWidth: '100%', lineHeight: 0 }}
        />
      </div>

      {/* Footer */}
      <div className="px-4 py-3 flex items-center justify-between">
        <span className={`text-xs font-semibold ${selected ? 'text-purple-700' : 'text-gray-400'}`}>
          Opção {index + 1}{selected ? ' ✓' : ''}
        </span>
        <button
          onClick={e => { e.stopPropagation(); onDownload() }}
          className="flex items-center gap-1 text-xs text-gray-400 hover:text-purple-600 transition"
          disabled={selecting}
          title="Baixar esta opção"
        >
          <Download className="w-3.5 h-3.5" />
        </button>
      </div>
    </div>
  )
}
