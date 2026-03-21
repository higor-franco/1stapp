import { useEffect, useState } from 'react'
import { useNavigate } from 'react-router-dom'

interface ExtraLink {
  label: string
  url: string
}

interface BioData {
  whatsapp: string
  instagram: string
  facebook: string
  tiktok: string
  youtube: string
  extra_links: ExtraLink[]
  published: boolean
}

const empty: BioData = {
  whatsapp: '',
  instagram: '',
  facebook: '',
  tiktok: '',
  youtube: '',
  extra_links: [],
  published: false,
}

export default function BioConfigPage({ userPlan, userSlug }: { userPlan: string; userSlug?: string }) {
  const navigate = useNavigate()
  const [bio, setBio] = useState<BioData>(empty)
  const [loading, setLoading] = useState(true)
  const [saving, setSaving] = useState(false)
  const [success, setSuccess] = useState(false)
  const [error, setError] = useState('')
  const [preview, setPreview] = useState(false)

  useEffect(() => {
    fetch('/api/bio/me')
      .then(r => r.json())
      .then(data => {
        if (data) setBio({ ...empty, ...data, extra_links: data.extra_links ?? [] })
      })
      .catch(() => {})
      .finally(() => setLoading(false))
  }, [])

  function addExtraLink() {
    setBio(b => ({ ...b, extra_links: [...b.extra_links, { label: '', url: '' }] }))
  }

  function removeExtraLink(idx: number) {
    setBio(b => ({ ...b, extra_links: b.extra_links.filter((_, i) => i !== idx) }))
  }

  function updateExtraLink(idx: number, field: 'label' | 'url', val: string) {
    setBio(b => ({
      ...b,
      extra_links: b.extra_links.map((l, i) => i === idx ? { ...l, [field]: val } : l),
    }))
  }

  async function handleSave(e: React.FormEvent) {
    e.preventDefault()
    setError('')
    setSuccess(false)
    setSaving(true)
    try {
      const res = await fetch('/api/bio', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(bio),
      })
      const data = await res.json()
      if (!res.ok) { setError(data.error || 'Erro ao salvar'); return }
      setBio({ ...empty, ...data, extra_links: data.extra_links ?? [] })
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
        <div className="w-12 h-12 bg-purple-100 rounded-2xl flex items-center justify-center mb-4">
          <svg className="w-6 h-6 text-purple-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M13.828 10.172a4 4 0 00-5.656 0l-4 4a4 4 0 105.656 5.656l1.102-1.101m-.758-4.899a4 4 0 005.656 0l4-4a4 4 0 00-5.656-5.656l-1.1 1.1" />
          </svg>
        </div>
        <h2 className="text-lg font-bold text-gray-900 mb-2">Recurso exclusivo do Plano Start</h2>
        <p className="text-sm text-gray-500 mb-5 max-w-xs">
          Crie sua Página Bio para colocar na bio do Instagram com todos os seus links.
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

  const bioUrl = userSlug ? `${window.location.origin}/bio/${userSlug}` : null

  return (
    <div className="max-w-xl">
      <div className="flex items-start justify-between mb-1">
        <h2 className="text-lg font-bold text-gray-900">Minha Página Bio</h2>
        {bioUrl && bio.published && (
          <a href={bioUrl} target="_blank" rel="noopener" className="text-xs text-blue-600 hover:underline flex items-center gap-1">
            Ver página ↗
          </a>
        )}
      </div>
      <p className="text-sm text-gray-500 mb-6">
        Página estilo Linktree para usar na bio do Instagram. Ficará em{' '}
        {userSlug && <code className="text-xs bg-gray-100 px-1 py-0.5 rounded">/bio/{userSlug}</code>}
      </p>

      <form onSubmit={handleSave} className="space-y-5">
        {/* WhatsApp */}
        <div>
          <label className="block text-sm font-medium text-gray-700 mb-1">WhatsApp</label>
          <div className="relative">
            <span className="absolute left-3 top-1/2 -translate-y-1/2 text-sm text-gray-400">💬</span>
            <input
              value={bio.whatsapp}
              onChange={e => setBio(b => ({ ...b, whatsapp: e.target.value }))}
              placeholder="(11) 99999-9999"
              inputMode="tel"
              className="w-full border border-gray-300 rounded-lg pl-9 pr-3 py-2.5 text-sm focus:outline-none focus:ring-2 focus:ring-blue-500"
            />
          </div>
        </div>

        {/* Social links */}
        <div className="grid grid-cols-2 gap-4">
          {[
            { key: 'instagram', icon: '📸', placeholder: '@seuperfil' },
            { key: 'facebook', icon: '📘', placeholder: 'suapagina' },
            { key: 'tiktok', icon: '🎵', placeholder: '@seuperfil' },
            { key: 'youtube', icon: '▶️', placeholder: '@seucanal' },
          ].map(({ key, icon, placeholder }) => (
            <div key={key}>
              <label className="block text-sm font-medium text-gray-700 mb-1 capitalize">{key}</label>
              <div className="relative">
                <span className="absolute left-3 top-1/2 -translate-y-1/2 text-sm">{icon}</span>
                <input
                  value={(bio as unknown as Record<string, string>)[key]}
                  onChange={e => setBio(b => ({ ...b, [key]: e.target.value }))}
                  placeholder={placeholder}
                  className="w-full border border-gray-300 rounded-lg pl-9 pr-3 py-2.5 text-sm focus:outline-none focus:ring-2 focus:ring-blue-500"
                />
              </div>
            </div>
          ))}
        </div>

        {/* Extra links */}
        <div>
          <div className="flex items-center justify-between mb-2">
            <label className="text-sm font-medium text-gray-700">Links adicionais</label>
            <button type="button" onClick={addExtraLink} className="text-xs text-blue-600 hover:text-blue-700 font-medium">
              + Adicionar link
            </button>
          </div>
          {bio.extra_links.length === 0 && (
            <p className="text-xs text-gray-400">Nenhum link adicional. Clique em "+ Adicionar link".</p>
          )}
          <div className="space-y-2">
            {bio.extra_links.map((link, idx) => (
              <div key={idx} className="flex gap-2 items-center">
                <input
                  value={link.label}
                  onChange={e => updateExtraLink(idx, 'label', e.target.value)}
                  placeholder="Rótulo"
                  className="w-1/3 border border-gray-300 rounded-lg px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-blue-500"
                />
                <input
                  value={link.url}
                  onChange={e => updateExtraLink(idx, 'url', e.target.value)}
                  placeholder="https://..."
                  type="url"
                  className="flex-1 border border-gray-300 rounded-lg px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-blue-500"
                />
                <button type="button" onClick={() => removeExtraLink(idx)} className="text-red-400 hover:text-red-600 text-lg leading-none">×</button>
              </div>
            ))}
          </div>
        </div>

        {/* Publish toggle */}
        <div className="flex items-center justify-between p-4 bg-gray-50 rounded-xl border border-gray-200">
          <div>
            <p className="text-sm font-medium text-gray-800">Publicar página Bio</p>
            <p className="text-xs text-gray-500 mt-0.5">Torna a página acessível em /bio/{userSlug ?? 'slug'}</p>
          </div>
          <button
            type="button"
            onClick={() => setBio(b => ({ ...b, published: !b.published }))}
            className={`relative inline-flex h-6 w-11 items-center rounded-full transition-colors ${bio.published ? 'bg-blue-600' : 'bg-gray-300'}`}
          >
            <span className={`inline-block h-4 w-4 transform rounded-full bg-white transition-transform ${bio.published ? 'translate-x-6' : 'translate-x-1'}`} />
          </button>
        </div>

        {/* Copy link */}
        {bioUrl && bio.published && (
          <div className="flex items-center gap-2 bg-blue-50 border border-blue-100 rounded-xl px-4 py-3">
            <span className="text-xs text-blue-700 font-mono truncate flex-1">{bioUrl}</span>
            <button
              type="button"
              onClick={() => navigator.clipboard.writeText(bioUrl)}
              className="text-xs text-blue-600 hover:text-blue-800 font-semibold shrink-0"
            >
              Copiar
            </button>
          </div>
        )}

        {/* Preview toggle */}
        <button
          type="button"
          onClick={() => setPreview(p => !p)}
          className="text-sm text-gray-500 hover:text-gray-700 underline"
        >
          {preview ? 'Ocultar preview' : 'Ver preview da página'}
        </button>

        {preview && (
          <div className="border border-gray-200 rounded-2xl overflow-hidden" style={{ height: 500 }}>
            <iframe
              src={userSlug ? `/bio/${userSlug}` : undefined}
              className="w-full h-full"
              title="Preview da Página Bio"
            />
          </div>
        )}

        {error && <div className="bg-red-50 border border-red-200 text-red-700 text-sm rounded-lg px-4 py-3">{error}</div>}
        {success && <div className="bg-green-50 border border-green-200 text-green-700 text-sm rounded-lg px-4 py-3">Página Bio salva com sucesso!</div>}

        <button
          type="submit"
          disabled={saving}
          className="w-full bg-blue-600 hover:bg-blue-700 disabled:bg-blue-400 text-white font-semibold py-3 rounded-xl text-sm transition-colors"
        >
          {saving ? 'Salvando...' : 'Salvar Página Bio'}
        </button>
      </form>
    </div>
  )
}
