import { useState } from 'react'
import { ArrowRight, ArrowLeft, Sparkles, RefreshCw, Globe, Check } from 'lucide-react'

interface Site {
  id: string
  slug: string
  business_name: string
  business_description: string
  color_palette: string
  html_content: string
  published: boolean
  generation_count: number
  url: string
}

interface Props {
  onSiteCreated: (site: Site) => void
}

const COLOR_PALETTES = [
  { id: 'azul',     label: 'Azul',     bg: 'bg-blue-500',   ring: 'ring-blue-400' },
  { id: 'verde',    label: 'Verde',    bg: 'bg-green-500',  ring: 'ring-green-400' },
  { id: 'roxo',     label: 'Roxo',     bg: 'bg-purple-500', ring: 'ring-purple-400' },
  { id: 'laranja',  label: 'Laranja',  bg: 'bg-orange-500', ring: 'ring-orange-400' },
  { id: 'vermelho', label: 'Vermelho', bg: 'bg-red-500',    ring: 'ring-red-400' },
  { id: 'preto',    label: 'Preto',    bg: 'bg-gray-900',   ring: 'ring-gray-600' },
  { id: 'rosa',     label: 'Rosa',     bg: 'bg-pink-500',   ring: 'ring-pink-400' },
]

export default function CreateSitePage({ onSiteCreated }: Props) {
  const [step, setStep] = useState<'form' | 'generating' | 'preview'>('form')
  const [businessName, setBusinessName] = useState('')
  const [description, setDescription] = useState('')
  const [colorPalette, setColorPalette] = useState('azul')
  const [site, setSite] = useState<Site | null>(null)
  const [error, setError] = useState('')
  const [publishing, setPublishing] = useState(false)

  async function handleGenerate() {
    setError('')
    setStep('generating')
    try {
      const r = await fetch('/api/sites/generate', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          business_name: businessName,
          business_description: description,
          color_palette: colorPalette,
        }),
      })
      const data = await r.json()
      if (!r.ok) {
        setError(data.error || 'Erro ao gerar site')
        setStep('form')
        return
      }
      setSite(data.site)
      setStep('preview')
    } catch {
      setError('Erro de conexão. Tente novamente.')
      setStep('form')
    }
  }

  async function handlePublish() {
    if (!site) return
    setPublishing(true)
    try {
      const r = await fetch('/api/sites/publish', {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ published: true }),
      })
      const data = await r.json()
      if (!r.ok) {
        setError(data.error || 'Erro ao publicar')
        return
      }
      onSiteCreated(data.site)
    } catch {
      setError('Erro de conexão. Tente novamente.')
    } finally {
      setPublishing(false)
    }
  }

  // ---- STEP: FORM ----
  if (step === 'form') {
    const canGenerate = businessName.trim().length >= 2 && description.trim().length >= 20
    return (
      <div className="max-w-2xl mx-auto">
        <div className="mb-8">
          <h1 className="text-2xl font-bold text-gray-900">Crie seu site com IA</h1>
          <p className="text-gray-500 mt-1">Descreva seu negócio e o Gemini gera um site profissional em segundos.</p>
        </div>

        {error && (
          <div className="mb-6 bg-red-50 border border-red-200 text-red-700 text-sm px-4 py-3 rounded-xl">
            {error}
          </div>
        )}

        <div className="bg-white rounded-2xl border border-gray-100 p-8 space-y-6">
          {/* Business name */}
          <div>
            <label className="block text-sm font-semibold text-gray-700 mb-2">
              Nome do seu negócio <span className="text-red-400">*</span>
            </label>
            <input
              type="text"
              value={businessName}
              onChange={e => setBusinessName(e.target.value)}
              placeholder="Ex: Clínica Bella Pele, Studio Foto Art, Advocacia Silva..."
              className="w-full px-4 py-3 border border-gray-200 rounded-xl text-sm focus:outline-none focus:ring-2 focus:ring-brand-500 transition"
            />
          </div>

          {/* Description */}
          <div>
            <label className="block text-sm font-semibold text-gray-700 mb-2">
              Descreva seu negócio em detalhes <span className="text-red-400">*</span>
            </label>
            <textarea
              value={description}
              onChange={e => setDescription(e.target.value)}
              rows={5}
              placeholder="Conte tudo sobre seu negócio: o que você faz, para quem atende, sua localização, diferenciais, serviços oferecidos, valores...

Ex: Sou fotógrafa de casamentos em São Paulo, especializada em noivas de alto padrão. Atendo em toda a Grande SP e litoral. Tenho 8 anos de experiência, estilo editorial e documental. Faço ensaios de noiva, pré-wedding e cobertura completa do casamento."
              className="w-full px-4 py-3 border border-gray-200 rounded-xl text-sm focus:outline-none focus:ring-2 focus:ring-brand-500 transition resize-none"
            />
            <p className={`text-xs mt-1 ${description.length >= 20 ? 'text-green-600' : 'text-gray-400'}`}>
              {description.length} caracteres {description.length < 20 && '(mínimo 20)'}
            </p>
          </div>

          {/* Color palette */}
          <div>
            <label className="block text-sm font-semibold text-gray-700 mb-3">
              Tema de cores do site
            </label>
            <div className="flex flex-wrap gap-3">
              {COLOR_PALETTES.map(p => (
                <button
                  key={p.id}
                  onClick={() => setColorPalette(p.id)}
                  className={`flex items-center gap-2 px-4 py-2 rounded-xl border-2 text-sm font-medium transition-all ${
                    colorPalette === p.id
                      ? 'border-gray-800 bg-gray-50'
                      : 'border-gray-200 hover:border-gray-300'
                  }`}
                >
                  <div className={`w-4 h-4 rounded-full ${p.bg}`} />
                  {p.label}
                  {colorPalette === p.id && <Check className="w-3 h-3 text-gray-800" />}
                </button>
              ))}
            </div>
          </div>

          <button
            onClick={handleGenerate}
            disabled={!canGenerate}
            className="w-full flex items-center justify-center gap-2 bg-brand-600 text-white py-4 rounded-xl font-semibold hover:bg-brand-700 transition-colors disabled:opacity-40 disabled:cursor-not-allowed shadow-md shadow-brand-200"
          >
            <Sparkles className="w-5 h-5" />
            Gerar meu site com IA
            <ArrowRight className="w-4 h-4" />
          </button>
        </div>
      </div>
    )
  }

  // ---- STEP: GENERATING ----
  if (step === 'generating') {
    return (
      <div className="max-w-lg mx-auto text-center py-16">
        <div className="w-20 h-20 bg-brand-50 rounded-full flex items-center justify-center mx-auto mb-6">
          <Sparkles className="w-10 h-10 text-brand-600 animate-pulse" />
        </div>
        <h2 className="text-2xl font-bold text-gray-900 mb-3">Gerando seu site...</h2>
        <p className="text-gray-500 mb-8">
          O Gemini está criando um site profissional personalizado para <strong>{businessName}</strong>.<br />
          Isso leva alguns segundos.
        </p>
        <div className="space-y-3 text-left bg-gray-50 rounded-2xl p-6">
          {[
            'Analisando seu negócio...',
            'Criando estrutura do site...',
            'Aplicando design e cores...',
            'Otimizando para mobile...',
          ].map((msg, i) => (
            <div key={i} className="flex items-center gap-3 text-sm text-gray-600">
              <div className="w-1.5 h-1.5 rounded-full bg-brand-400 animate-pulse" style={{ animationDelay: `${i * 0.3}s` }} />
              {msg}
            </div>
          ))}
        </div>
      </div>
    )
  }

  // ---- STEP: PREVIEW ----
  return (
    <div>
      <div className="flex items-center justify-between mb-6">
        <div>
          <h1 className="text-2xl font-bold text-gray-900">Seu site está pronto! 🎉</h1>
          <p className="text-gray-500 mt-1">Veja o preview e publique quando estiver satisfeito.</p>
        </div>
        <div className="flex items-center gap-3">
          <button
            onClick={() => setStep('form')}
            className="flex items-center gap-2 px-4 py-2 border border-gray-200 rounded-xl text-sm font-medium text-gray-600 hover:bg-gray-50 transition"
          >
            <ArrowLeft className="w-4 h-4" />
            Editar
          </button>
          <button
            onClick={handleGenerate}
            className="flex items-center gap-2 px-4 py-2 border border-gray-200 rounded-xl text-sm font-medium text-gray-600 hover:bg-gray-50 transition"
          >
            <RefreshCw className="w-4 h-4" />
            Regenerar
          </button>
          <button
            onClick={handlePublish}
            disabled={publishing}
            className="flex items-center gap-2 px-5 py-2.5 bg-green-600 text-white rounded-xl text-sm font-semibold hover:bg-green-700 transition disabled:opacity-50 shadow-sm"
          >
            <Globe className="w-4 h-4" />
            {publishing ? 'Publicando...' : 'Publicar site'}
          </button>
        </div>
      </div>

      {error && (
        <div className="mb-4 bg-red-50 border border-red-200 text-red-700 text-sm px-4 py-3 rounded-xl">
          {error}
        </div>
      )}

      {/* Preview iframe */}
      <div className="rounded-2xl overflow-hidden border-2 border-gray-200 shadow-xl bg-white">
        {/* Browser chrome mockup */}
        <div className="bg-gray-100 px-4 py-3 flex items-center gap-3 border-b border-gray-200">
          <div className="flex gap-1.5">
            <div className="w-3 h-3 rounded-full bg-red-400" />
            <div className="w-3 h-3 rounded-full bg-yellow-400" />
            <div className="w-3 h-3 rounded-full bg-green-400" />
          </div>
          <div className="flex-1 bg-white rounded-lg px-3 py-1.5 text-xs text-gray-400 font-mono">
            preview — {site?.business_name}
          </div>
        </div>
        <iframe
          srcDoc={site?.html_content ?? ''}
          sandbox="allow-scripts allow-same-origin"
          className="w-full"
          style={{ height: '70vh', border: 'none' }}
          title="Preview do site"
        />
      </div>
    </div>
  )
}
