import { useEffect, useState } from 'react'
import { useNavigate } from 'react-router-dom'

interface Step {
  name: string
  completed: boolean
}

interface OnboardingData {
  steps: Step[]
  all_complete: boolean
}

const STEP_META: Record<string, {
  icon: string
  title: string
  description: string
  why: string
  section?: string
}> = {
  site: {
    icon: '🌐',
    title: 'Site criado',
    description: 'Seu site foi gerado e está pronto para ser publicado.',
    why: 'Sua presença online começa aqui.',
    section: 'criar-site',
  },
  logo: {
    icon: '🎨',
    title: 'Gere sua logo',
    description: 'Crie uma logo profissional com IA a partir do nome e descrição do seu negócio.',
    why: 'Uma boa logo transmite credibilidade e diferencia sua marca.',
    section: 'logo',
  },
  bio: {
    icon: '🔗',
    title: 'Monte sua Página Bio',
    description: 'Crie uma página com todos os seus links para usar na bio do Instagram.',
    why: 'Ideal para direcionar seguidores para seu site, WhatsApp e redes sociais.',
    section: 'bio',
  },
  whatsapp: {
    icon: '💬',
    title: 'Conecte o WhatsApp',
    description: 'Adicione um widget de atendimento via WhatsApp Oficial (Octadesk) ao seu site.',
    why: 'Facilita o contato direto com clientes e aumenta as conversões.',
    section: 'octadesk',
  },
  pagamentos: {
    icon: '💳',
    title: 'Ative pagamentos no site',
    description: 'Conecte sua conta Vindi e receba pagamentos direto no seu site.',
    why: 'Seus clientes poderão pagar sem sair do seu site.',
    section: 'pagamentos',
  },
  dominio: {
    icon: '🌐',
    title: 'Adicione seu domínio',
    description: 'Use um domínio próprio (ex: www.meusite.com.br) no lugar do subdomínio gratuito.',
    why: 'Um domínio próprio passa mais profissionalismo e é mais fácil de lembrar.',
    section: 'dominio',
  },
  seo: {
    icon: '🔍',
    title: 'Configure o SEO',
    description: 'Publique seu site para ativar as configurações de SEO automáticas.',
    why: 'SEO ajuda seu site a aparecer no Google e ser encontrado por clientes.',
    section: 'criar-site',
  },
}

export default function OnboardingPage() {
  const navigate = useNavigate()
  const [data, setData] = useState<OnboardingData | null>(null)
  const [loading, setLoading] = useState(true)
  const [skipping, setSkipping] = useState<string | null>(null)

  useEffect(() => {
    fetch('/api/onboarding')
      .then(r => r.json())
      .then(setData)
      .catch(() => {})
      .finally(() => setLoading(false))
  }, [])

  async function skipStep(name: string) {
    setSkipping(name)
    try {
      await fetch(`/api/onboarding/${name}/skip`, { method: 'POST' })
      setData(d => d ? {
        ...d,
        steps: d.steps.map(s => s.name === name ? { ...s, completed: true } : s),
      } : d)
    } finally {
      setSkipping(null)
    }
  }

  function goToSection(section?: string) {
    navigate('/painel', { state: { section } })
  }

  if (loading) {
    return (
      <div className="min-h-screen bg-gray-50 flex items-center justify-center">
        <div className="animate-spin w-6 h-6 border-2 border-blue-600 border-t-transparent rounded-full" />
      </div>
    )
  }

  const steps = data?.steps ?? []
  const completed = steps.filter(s => s.completed).length
  const total = steps.length
  const pct = total > 0 ? Math.round((completed / total) * 100) : 0

  return (
    <div className="min-h-screen bg-gray-50">
      {/* Header */}
      <div className="bg-white border-b border-gray-100 px-4 py-4">
        <div className="max-w-2xl mx-auto flex items-center justify-between">
          <div className="flex items-center gap-3">
            <div className="w-8 h-8 bg-blue-600 rounded-xl flex items-center justify-center">
              <svg className="w-4 h-4 text-white" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M13 10V3L4 14h7v7l9-11h-7z" />
              </svg>
            </div>
            <span className="font-bold text-gray-900">Locaweb Start</span>
          </div>
          <button
            onClick={() => navigate('/painel')}
            className="text-sm text-gray-500 hover:text-gray-700"
          >
            Ir para o painel →
          </button>
        </div>
      </div>

      <div className="max-w-2xl mx-auto px-4 py-10">
        {/* Intro */}
        <div className="text-center mb-8">
          <h1 className="text-2xl font-bold text-gray-900 mb-2">Configure sua presença online</h1>
          <p className="text-gray-500 text-sm">
            Complete as etapas abaixo para aproveitar tudo que o Plano Start oferece. Cada etapa é opcional.
          </p>
        </div>

        {/* Progress bar */}
        <div className="bg-white rounded-2xl border border-gray-200 p-5 mb-6">
          <div className="flex items-center justify-between mb-3">
            <span className="text-sm font-semibold text-gray-700">{completed} de {total} etapas concluídas</span>
            <span className="text-sm font-bold text-blue-600">{pct}%</span>
          </div>
          <div className="w-full bg-gray-100 rounded-full h-2.5">
            <div
              className="bg-blue-600 h-2.5 rounded-full transition-all duration-500"
              style={{ width: `${pct}%` }}
            />
          </div>
          {data?.all_complete && (
            <p className="text-sm text-green-700 font-medium mt-3 text-center">
              🎉 Tudo configurado! Seu site está completo.
            </p>
          )}
        </div>

        {/* Steps */}
        <div className="space-y-3">
          {steps.map((step) => {
            const meta = STEP_META[step.name]
            if (!meta) return null
            return (
              <div
                key={step.name}
                className={`bg-white rounded-2xl border p-5 transition-all ${
                  step.completed ? 'border-green-200 opacity-75' : 'border-gray-200'
                }`}
              >
                <div className="flex items-start gap-4">
                  {/* Icon / check */}
                  <div className={`w-10 h-10 rounded-xl flex items-center justify-center text-lg shrink-0 ${
                    step.completed ? 'bg-green-100' : 'bg-blue-50'
                  }`}>
                    {step.completed ? '✅' : meta.icon}
                  </div>

                  <div className="flex-1 min-w-0">
                    <div className="flex items-start justify-between gap-2">
                      <div>
                        <p className={`font-semibold text-gray-900 ${step.completed ? 'line-through text-gray-400' : ''}`}>
                          {meta.title}
                        </p>
                        {!step.completed && (
                          <>
                            <p className="text-sm text-gray-500 mt-0.5">{meta.description}</p>
                            <p className="text-xs text-blue-600 mt-1">💡 {meta.why}</p>
                          </>
                        )}
                      </div>
                      {step.completed && (
                        <span className="text-xs text-green-600 font-semibold shrink-0">Concluído</span>
                      )}
                    </div>

                    {!step.completed && (
                      <div className="flex gap-2 mt-3">
                        <button
                          onClick={() => goToSection(meta.section)}
                          className="bg-blue-600 hover:bg-blue-700 text-white text-xs font-semibold px-4 py-2 rounded-lg"
                        >
                          Configurar agora
                        </button>
                        <button
                          onClick={() => skipStep(step.name)}
                          disabled={skipping === step.name}
                          className="text-xs text-gray-400 hover:text-gray-600 px-3 py-2 rounded-lg hover:bg-gray-50"
                        >
                          {skipping === step.name ? '...' : 'Fazer depois'}
                        </button>
                      </div>
                    )}
                  </div>
                </div>
              </div>
            )
          })}
        </div>

        {/* CTA */}
        <div className="text-center mt-8">
          <button
            onClick={() => navigate('/painel')}
            className="bg-gray-900 hover:bg-gray-800 text-white font-semibold px-8 py-3 rounded-xl text-sm"
          >
            Ir para o painel de controle →
          </button>
        </div>
      </div>
    </div>
  )
}
