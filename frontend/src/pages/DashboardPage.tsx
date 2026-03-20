import { useState, useEffect } from 'react'
import {
  Zap, Globe, Sparkles, LogOut, LayoutDashboard,
  ExternalLink, RefreshCw, Eye, EyeOff, Copy, Check,
  Search, FileText, Bot, Link2
} from 'lucide-react'
import CreateSitePage from './CreateSitePage'
import LogoPage from './LogoPage'

interface User {
  id: string
  email: string
  name: string
  plan: string
}

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
  user: User
  onLogout: () => void
}

type Section = 'dashboard' | 'criar-site' | 'logo'

export default function DashboardPage({ user, onLogout }: Props) {
  const [section, setSection] = useState<Section>('dashboard')
  const [site, setSite] = useState<Site | null | undefined>(undefined) // undefined = loading
  const [loggingOut, setLoggingOut] = useState(false)
  const [toggling, setToggling] = useState(false)
  const [copied, setCopied] = useState(false)

  useEffect(() => {
    fetch('/api/sites/me')
      .then(r => r.json())
      .then(data => setSite(data.site ?? null))
      .catch(() => setSite(null))
  }, [])

  async function handleLogout() {
    setLoggingOut(true)
    await fetch('/api/auth/logout', { method: 'POST' })
    onLogout()
  }

  async function togglePublish() {
    if (!site) return
    setToggling(true)
    try {
      const r = await fetch('/api/sites/publish', {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ published: !site.published }),
      })
      const data = await r.json()
      if (r.ok) setSite(data.site)
    } finally {
      setToggling(false)
    }
  }

  function copyLink(url: string) {
    const fullUrl = `${window.location.origin}${url}`
    navigator.clipboard.writeText(fullUrl)
    setCopied(true)
    setTimeout(() => setCopied(false), 2000)
  }

  const navItems = [
    { id: 'dashboard' as Section, label: 'Dashboard', icon: LayoutDashboard },
    { id: 'criar-site' as Section, label: site ? 'Meu Site' : 'Criar Site', icon: Globe },
    { id: 'logo' as Section, label: 'Minha Logo', icon: Sparkles },
  ]

  return (
    <div className="min-h-screen bg-gray-50 flex">
      {/* Sidebar */}
      <aside className="fixed left-0 top-0 h-full w-64 bg-white border-r border-gray-100 flex flex-col z-10">
        <div className="p-5 border-b border-gray-100">
          <div className="flex items-center gap-2">
            <div className="w-7 h-7 bg-brand-600 rounded-lg flex items-center justify-center">
              <Zap className="w-3.5 h-3.5 text-white" />
            </div>
            <span className="font-bold text-gray-900">Locaweb Start</span>
          </div>
        </div>

        <nav className="flex-1 p-4 space-y-1">
          {navItems.map(item => (
            <button
              key={item.id}
              onClick={() => setSection(item.id)}
              className={`w-full flex items-center gap-3 px-4 py-2.5 rounded-xl text-sm font-medium transition-colors ${
                section === item.id
                  ? 'bg-brand-50 text-brand-700'
                  : 'text-gray-500 hover:bg-gray-50 hover:text-gray-900'
              }`}
            >
              <item.icon className="w-4 h-4" />
              {item.label}
            </button>
          ))}
        </nav>

        <div className="p-4 border-t border-gray-100">
          <div className="flex items-center gap-3 mb-3">
            <div className="w-8 h-8 bg-brand-100 rounded-full flex items-center justify-center shrink-0">
              <span className="text-brand-700 text-xs font-bold">{user.name[0].toUpperCase()}</span>
            </div>
            <div className="flex-1 min-w-0">
              <p className="text-sm font-medium text-gray-900 truncate">{user.name}</p>
              <p className="text-xs text-gray-400">{user.plan === 'free' ? 'Plano Free' : 'Plano Start'}</p>
            </div>
          </div>
          <button
            onClick={handleLogout}
            disabled={loggingOut}
            className="w-full flex items-center gap-2 px-3 py-2 text-xs text-gray-500 hover:text-red-600 hover:bg-red-50 rounded-lg transition-colors"
          >
            <LogOut className="w-3.5 h-3.5" />
            Sair
          </button>
        </div>
      </aside>

      {/* Main */}
      <main className="pl-64 flex-1 p-8">
        {/* Dashboard section */}
        {section === 'dashboard' && (
          <div className="max-w-3xl mx-auto">
            <div className="mb-8">
              <h1 className="text-2xl font-bold text-gray-900">Olá, {user.name.split(' ')[0]}! 👋</h1>
              <p className="text-gray-500 mt-1">Bem-vindo ao seu painel.</p>
            </div>

            {/* Site card */}
            {site === undefined ? (
              <div className="bg-white rounded-2xl border border-gray-100 p-8 animate-pulse">
                <div className="h-4 bg-gray-100 rounded w-1/3 mb-3" />
                <div className="h-3 bg-gray-100 rounded w-2/3" />
              </div>
            ) : site === null ? (
              <div className="bg-gradient-to-br from-brand-600 to-brand-800 rounded-2xl p-8 text-white mb-6">
                <h2 className="text-xl font-bold mb-2">Crie seu site agora</h2>
                <p className="text-brand-100 text-sm mb-6">
                  Descreva seu negócio e o Gemini gera um site profissional em segundos.
                </p>
                <button
                  onClick={() => setSection('criar-site')}
                  className="bg-white text-brand-700 px-6 py-3 rounded-xl font-semibold text-sm hover:bg-brand-50 transition-colors"
                >
                  Criar meu site →
                </button>
              </div>
            ) : (
              <div className="bg-white rounded-2xl border border-gray-100 p-6 mb-6">
                <div className="flex items-start justify-between mb-4">
                  <div>
                    <h2 className="font-semibold text-gray-900 text-lg">{site.business_name}</h2>
                    <p className="text-sm text-gray-400 mt-0.5">
                      {site.published ? '🟢 Publicado' : '⚪ Não publicado'} •{' '}
                      {site.generation_count} {site.generation_count === 1 ? 'geração' : 'gerações'}
                    </p>
                  </div>
                  <div className="flex items-center gap-2">
                    <button
                      onClick={() => setSection('criar-site')}
                      className="flex items-center gap-1.5 px-3 py-2 border border-gray-200 rounded-lg text-xs font-medium text-gray-600 hover:bg-gray-50 transition"
                    >
                      <RefreshCw className="w-3 h-3" />
                      Editar
                    </button>
                    <button
                      onClick={togglePublish}
                      disabled={toggling}
                      className={`flex items-center gap-1.5 px-3 py-2 rounded-lg text-xs font-medium transition ${
                        site.published
                          ? 'bg-red-50 text-red-600 hover:bg-red-100'
                          : 'bg-green-50 text-green-700 hover:bg-green-100'
                      }`}
                    >
                      {site.published ? <EyeOff className="w-3 h-3" /> : <Eye className="w-3 h-3" />}
                      {site.published ? 'Despublicar' : 'Publicar'}
                    </button>
                  </div>
                </div>

                {site.published && (
                  <div className="flex items-center gap-2 bg-gray-50 rounded-xl px-4 py-3">
                    <Globe className="w-4 h-4 text-gray-400 shrink-0" />
                    <span className="text-sm text-gray-600 font-mono truncate flex-1">
                      {window.location.origin}{site.url}
                    </span>
                    <button
                      onClick={() => copyLink(site.url)}
                      className="text-gray-400 hover:text-brand-600 transition shrink-0"
                      title="Copiar link"
                    >
                      {copied ? <Check className="w-4 h-4 text-green-500" /> : <Copy className="w-4 h-4" />}
                    </button>
                    <a
                      href={site.url}
                      target="_blank"
                      rel="noreferrer"
                      className="text-gray-400 hover:text-brand-600 transition shrink-0"
                    >
                      <ExternalLink className="w-4 h-4" />
                    </a>
                  </div>
                )}
              </div>
            )}

            {/* Upgrade banner */}
            {user.plan === 'free' && (
              <div className="bg-amber-50 border border-amber-200 rounded-2xl p-6 flex items-center justify-between">
                <div>
                  <p className="font-semibold text-amber-900">Faça upgrade para o Plano Start</p>
                  <p className="text-amber-700 text-sm mt-1">
                    Domínio próprio, gerações ilimitadas, SEO avançado, Página Bio, WhatsApp e pagamentos.
                  </p>
                </div>
                <button className="bg-amber-500 text-white px-5 py-2.5 rounded-xl font-semibold text-sm hover:bg-amber-600 transition shrink-0 ml-4">
                  Fazer upgrade
                </button>
              </div>
            )}
          </div>
        )}

        {/* Create/Edit site section */}
        {section === 'criar-site' && (
          site && site.html_content ? (
            <SiteManagement
              site={site}
              onSiteUpdate={setSite}
              onRegenerate={() => setSite(null)}
            />
          ) : (
            <CreateSitePage
              onSiteCreated={(newSite) => {
                setSite(newSite)
                setSection('dashboard')
              }}
            />
          )
        )}

        {/* Logo section */}
        {section === 'logo' && (
          <LogoPage user={user} />
        )}
      </main>
    </div>
  )
}

// ---- Site Management (existing site) ----
function SiteManagement({
  site,
  onSiteUpdate,
  onRegenerate,
}: {
  site: Site
  onSiteUpdate: (s: Site) => void
  onRegenerate: () => void
}) {
  const [previewOpen, setPreviewOpen] = useState(true)
  const [publishing, setPublishing] = useState(false)
  const [copied, setCopied] = useState(false)

  async function togglePublish() {
    setPublishing(true)
    try {
      const r = await fetch('/api/sites/publish', {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ published: !site.published }),
      })
      const data = await r.json()
      if (r.ok) onSiteUpdate(data.site)
    } finally {
      setPublishing(false)
    }
  }

  function copyLink() {
    navigator.clipboard.writeText(`${window.location.origin}${site.url}`)
    setCopied(true)
    setTimeout(() => setCopied(false), 2000)
  }

  return (
    <div>
      <div className="flex items-center justify-between mb-6">
        <div>
          <h1 className="text-2xl font-bold text-gray-900">{site.business_name}</h1>
          <p className="text-gray-500 mt-0.5 text-sm">
            {site.published ? '🟢 Publicado' : '⚪ Não publicado'} • {site.generation_count} {site.generation_count === 1 ? 'geração' : 'gerações'}
          </p>
        </div>
        <div className="flex items-center gap-2">
          <button
            onClick={onRegenerate}
            className="flex items-center gap-1.5 px-4 py-2 border border-gray-200 rounded-xl text-sm font-medium text-gray-600 hover:bg-gray-50 transition"
          >
            <RefreshCw className="w-4 h-4" />
            Criar nova versão
          </button>
          <button
            onClick={togglePublish}
            disabled={publishing}
            className={`flex items-center gap-1.5 px-4 py-2 rounded-xl text-sm font-semibold transition ${
              site.published
                ? 'bg-red-50 text-red-600 hover:bg-red-100 border border-red-200'
                : 'bg-green-600 text-white hover:bg-green-700'
            }`}
          >
            {site.published ? <EyeOff className="w-4 h-4" /> : <Eye className="w-4 h-4" />}
            {site.published ? 'Despublicar' : 'Publicar'}
          </button>
        </div>
      </div>

      {/* Site URL */}
      {site.published && (
        <div className="flex items-center gap-2 bg-green-50 border border-green-200 rounded-xl px-4 py-3 mb-6">
          <Globe className="w-4 h-4 text-green-600 shrink-0" />
          <span className="text-sm text-green-800 font-mono flex-1 truncate">
            {window.location.origin}{site.url}
          </span>
          <button onClick={copyLink} className="text-green-600 hover:text-green-800 transition">
            {copied ? <Check className="w-4 h-4" /> : <Copy className="w-4 h-4" />}
          </button>
          <a href={site.url} target="_blank" rel="noreferrer" className="text-green-600 hover:text-green-800 transition">
            <ExternalLink className="w-4 h-4" />
          </a>
        </div>
      )}

      {/* Preview */}
      <div className="rounded-2xl overflow-hidden border-2 border-gray-200 shadow-lg mb-6">
        <div className="bg-gray-100 px-4 py-3 flex items-center gap-3 border-b border-gray-200">
          <div className="flex gap-1.5">
            <div className="w-3 h-3 rounded-full bg-red-400" />
            <div className="w-3 h-3 rounded-full bg-yellow-400" />
            <div className="w-3 h-3 rounded-full bg-green-400" />
          </div>
          <div className="flex-1 bg-white rounded-lg px-3 py-1.5 text-xs text-gray-400 font-mono">
            {window.location.origin}{site.url}
          </div>
          <button onClick={() => setPreviewOpen(p => !p)} className="text-xs text-gray-500 hover:text-gray-700">
            {previewOpen ? 'Ocultar' : 'Mostrar'}
          </button>
        </div>
        {previewOpen && (
          <iframe
            srcDoc={site.html_content}
            sandbox="allow-scripts allow-same-origin"
            className="w-full"
            style={{ height: '65vh', border: 'none' }}
            title="Preview do site"
          />
        )}
      </div>

      {/* SEO Status */}
      <SEOStatus site={site} />
    </div>
  )
}

// ---- SEO Status Card ----
function SEOStatus({ site }: { site: Site }) {
  const origin = window.location.origin

  const checks = [
    {
      icon: Search,
      label: 'Meta tags SEO',
      description: 'title, description, Open Graph',
      ok: true,
      color: 'text-green-600',
      bg: 'bg-green-50',
    },
    {
      icon: FileText,
      label: 'Sitemap.xml',
      description: site.published ? 'Site incluído no sitemap' : 'Publique o site para aparecer',
      ok: site.published,
      color: site.published ? 'text-green-600' : 'text-amber-500',
      bg: site.published ? 'bg-green-50' : 'bg-amber-50',
      link: `${origin}/sitemap.xml`,
    },
    {
      icon: Bot,
      label: 'robots.txt',
      description: 'Permite indexação por Google e LLMs',
      ok: true,
      color: 'text-green-600',
      bg: 'bg-green-50',
      link: `${origin}/robots.txt`,
    },
    {
      icon: Link2,
      label: 'JSON-LD Schema',
      description: site.published ? 'LocalBusiness injetado automaticamente' : 'Disponível após publicação',
      ok: site.published,
      color: site.published ? 'text-green-600' : 'text-amber-500',
      bg: site.published ? 'bg-green-50' : 'bg-amber-50',
    },
    {
      icon: Bot,
      label: 'llms.txt',
      description: site.published ? 'Site visível para ChatGPT, Claude, Gemini' : 'Disponível após publicação',
      ok: site.published,
      color: site.published ? 'text-green-600' : 'text-amber-500',
      bg: site.published ? 'bg-green-50' : 'bg-amber-50',
      link: `${origin}/llms.txt`,
    },
  ]

  return (
    <div className="bg-white rounded-2xl border border-gray-100 p-6">
      <div className="flex items-center gap-2 mb-4">
        <Search className="w-4 h-4 text-gray-400" />
        <h3 className="font-semibold text-gray-900 text-sm">SEO e Descoberta</h3>
      </div>
      <div className="space-y-3">
        {checks.map((c) => (
          <div key={c.label} className="flex items-start gap-3">
            <div className={`w-7 h-7 rounded-lg flex items-center justify-center shrink-0 ${c.bg}`}>
              <c.icon className={`w-3.5 h-3.5 ${c.color}`} />
            </div>
            <div className="flex-1 min-w-0">
              <div className="flex items-center gap-2">
                <span className="text-sm font-medium text-gray-800">{c.label}</span>
                {c.ok
                  ? <span className="text-xs text-green-600 font-medium">✓ Ativo</span>
                  : <span className="text-xs text-amber-500 font-medium">⚠ Pendente</span>
                }
              </div>
              <p className="text-xs text-gray-400 mt-0.5">{c.description}</p>
            </div>
            {c.link && (
              <a
                href={c.link}
                target="_blank"
                rel="noreferrer"
                className="text-gray-300 hover:text-brand-500 transition shrink-0"
                title="Abrir"
              >
                <ExternalLink className="w-3.5 h-3.5" />
              </a>
            )}
          </div>
        ))}
      </div>
    </div>
  )
}
