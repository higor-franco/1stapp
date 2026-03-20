import { Link } from 'react-router-dom'
import { Sparkles, Globe, Search, CreditCard, Link2, MessageCircle, ArrowRight, Check, Zap } from 'lucide-react'

interface Props {
  user: { name: string; plan: string } | null
}

export default function LandingPage({ user }: Props) {
  return (
    <div className="min-h-screen bg-white">
      {/* Nav */}
      <nav className="fixed top-0 w-full z-50 bg-white/80 backdrop-blur-md border-b border-gray-100">
        <div className="max-w-6xl mx-auto px-6 h-16 flex items-center justify-between">
          <div className="flex items-center gap-2">
            <div className="w-8 h-8 bg-brand-600 rounded-lg flex items-center justify-center">
              <Zap className="w-4 h-4 text-white" />
            </div>
            <span className="font-bold text-gray-900 text-lg">Locaweb Start</span>
          </div>
          <div className="flex items-center gap-3">
            {user ? (
              <Link to="/painel" className="bg-brand-600 text-white px-4 py-2 rounded-lg text-sm font-medium hover:bg-brand-700 transition-colors">
                Meu painel
              </Link>
            ) : (
              <>
                <Link to="/entrar" className="text-gray-600 hover:text-gray-900 text-sm font-medium transition-colors">
                  Entrar
                </Link>
                <Link to="/cadastro" className="bg-brand-600 text-white px-4 py-2 rounded-lg text-sm font-medium hover:bg-brand-700 transition-colors">
                  Criar site grátis
                </Link>
              </>
            )}
          </div>
        </div>
      </nav>

      {/* Hero */}
      <section className="pt-32 pb-24 px-6 bg-gradient-to-b from-brand-50 to-white">
        <div className="max-w-4xl mx-auto text-center">
          <div className="inline-flex items-center gap-2 bg-brand-100 text-brand-700 px-4 py-2 rounded-full text-sm font-medium mb-8">
            <Sparkles className="w-4 h-4" />
            Site profissional em menos de 2 minutos
          </div>
          <h1 className="text-5xl md:text-6xl font-extrabold text-gray-900 leading-tight mb-6">
            Descreva seu negócio.<br />
            <span className="text-brand-600">A IA cria seu site.</span>
          </h1>
          <p className="text-xl text-gray-500 max-w-2xl mx-auto mb-10">
            Sem precisar saber programar. Sem contratar designer. Com hospedagem inclusa, logo, SEO automático e muito mais — tudo em uma plataforma.
          </p>
          <div className="flex flex-col sm:flex-row gap-4 justify-center">
            <Link to="/cadastro" className="inline-flex items-center justify-center gap-2 bg-brand-600 text-white px-8 py-4 rounded-xl text-lg font-semibold hover:bg-brand-700 transition-colors shadow-lg shadow-brand-200">
              Criar meu site grátis
              <ArrowRight className="w-5 h-5" />
            </Link>
            <Link to="/entrar" className="inline-flex items-center justify-center gap-2 border border-gray-200 text-gray-700 px-8 py-4 rounded-xl text-lg font-medium hover:bg-gray-50 transition-colors">
              Já tenho conta
            </Link>
          </div>
        </div>
      </section>

      {/* How it works */}
      <section className="py-24 px-6 bg-white">
        <div className="max-w-5xl mx-auto">
          <div className="text-center mb-16">
            <h2 className="text-3xl font-bold text-gray-900 mb-4">Do prompt ao ar em 3 passos</h2>
            <p className="text-gray-500">Mais simples do que parece</p>
          </div>
          <div className="grid md:grid-cols-3 gap-8">
            {[
              { step: '01', title: 'Descreva seu negócio', desc: 'Escreva em português o que você faz, para quem atende e o que quer transmitir.' },
              { step: '02', title: 'A IA gera seu site', desc: 'O Gemini cria um site profissional e responsivo em segundos, com textos e design personalizados.' },
              { step: '03', title: 'Publique com 1 clique', desc: 'Seu site vai ao ar com subdomínio gratuito. No plano Start, use seu próprio domínio.' },
            ].map(item => (
              <div key={item.step} className="relative p-8 rounded-2xl border border-gray-100 hover:border-brand-200 hover:shadow-lg transition-all">
                <div className="text-5xl font-extrabold text-brand-100 mb-4">{item.step}</div>
                <h3 className="text-lg font-semibold text-gray-900 mb-2">{item.title}</h3>
                <p className="text-gray-500 text-sm leading-relaxed">{item.desc}</p>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* Features */}
      <section className="py-24 px-6 bg-gray-50">
        <div className="max-w-5xl mx-auto">
          <div className="text-center mb-16">
            <h2 className="text-3xl font-bold text-gray-900 mb-4">Tudo que seu negócio precisa</h2>
            <p className="text-gray-500">Uma plataforma completa para sua presença online</p>
          </div>
          <div className="grid md:grid-cols-2 lg:grid-cols-3 gap-6">
            {[
              { icon: Sparkles, title: 'Site com IA', desc: 'Gemini gera um site profissional e responsivo a partir da sua descrição.', color: 'text-purple-600 bg-purple-50' },
              { icon: Globe, title: 'Logo com IA', desc: 'Claude cria 3 opções de logo em SVG vetorial para o seu negócio.', color: 'text-blue-600 bg-blue-50' },
              { icon: Search, title: 'SEO Automático', desc: 'Meta tags, sitemap, JSON-LD e llms.txt para aparecer no Google e nos LLMs.', color: 'text-green-600 bg-green-50' },
              { icon: Link2, title: 'Página Bio', desc: 'Linktree do seu negócio para colocar na bio do Instagram.', color: 'text-orange-600 bg-orange-50' },
              { icon: MessageCircle, title: 'WhatsApp Oficial', desc: 'Widget de atendimento Octadesk no seu site com número oficial.', color: 'text-emerald-600 bg-emerald-50' },
              { icon: CreditCard, title: 'Pagamentos', desc: 'Aceite pagamentos no seu site via Vindi com cartão ou boleto.', color: 'text-rose-600 bg-rose-50' },
            ].map(f => (
              <div key={f.title} className="bg-white p-6 rounded-2xl border border-gray-100 hover:shadow-md transition-shadow">
                <div className={`w-10 h-10 rounded-xl flex items-center justify-center mb-4 ${f.color}`}>
                  <f.icon className="w-5 h-5" />
                </div>
                <h3 className="font-semibold text-gray-900 mb-2">{f.title}</h3>
                <p className="text-sm text-gray-500 leading-relaxed">{f.desc}</p>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* Pricing */}
      <section className="py-24 px-6 bg-white">
        <div className="max-w-4xl mx-auto">
          <div className="text-center mb-16">
            <h2 className="text-3xl font-bold text-gray-900 mb-4">Planos simples e transparentes</h2>
            <p className="text-gray-500">Comece grátis e faça upgrade quando precisar</p>
          </div>
          <div className="grid md:grid-cols-2 gap-8 max-w-3xl mx-auto">
            {/* Free */}
            <div className="p-8 rounded-2xl border-2 border-gray-200">
              <div className="mb-6">
                <p className="text-sm font-medium text-gray-500 uppercase tracking-wide mb-1">Free</p>
                <div className="flex items-baseline gap-1">
                  <span className="text-4xl font-extrabold text-gray-900">R$ 0</span>
                  <span className="text-gray-400">/mês</span>
                </div>
                <p className="text-gray-500 text-sm mt-2">Para começar a ter presença online</p>
              </div>
              <ul className="space-y-3 mb-8">
                {[
                  '1 site hospedado',
                  'Subdomínio gratuito',
                  '3 gerações de site por mês',
                  '1 logo por mês',
                  'SEO básico automático',
                  'Badge "Criado com Locaweb Start"',
                ].map(item => (
                  <li key={item} className="flex items-start gap-3">
                    <Check className="w-4 h-4 text-gray-400 mt-0.5 shrink-0" />
                    <span className="text-sm text-gray-600">{item}</span>
                  </li>
                ))}
              </ul>
              <Link to="/cadastro" className="block w-full text-center border-2 border-gray-200 text-gray-700 px-6 py-3 rounded-xl font-semibold hover:bg-gray-50 transition-colors">
                Começar grátis
              </Link>
            </div>

            {/* Start */}
            <div className="p-8 rounded-2xl border-2 border-brand-600 relative shadow-xl shadow-brand-100">
              <div className="absolute -top-3 left-1/2 -translate-x-1/2">
                <span className="bg-brand-600 text-white text-xs font-bold px-4 py-1 rounded-full uppercase tracking-wide">Mais popular</span>
              </div>
              <div className="mb-6">
                <p className="text-sm font-medium text-brand-600 uppercase tracking-wide mb-1">Start</p>
                <div className="flex items-baseline gap-1">
                  <span className="text-4xl font-extrabold text-gray-900">R$ 49</span>
                  <span className="text-gray-400">/mês</span>
                </div>
                <p className="text-gray-500 text-sm mt-2">Para levar seu negócio a sério</p>
              </div>
              <ul className="space-y-3 mb-8">
                {[
                  'Tudo do plano Free',
                  'Domínio personalizado',
                  'Gerações e edições ilimitadas',
                  'Logo ilimitada',
                  'SEO avançado + llms.txt',
                  'Relatório de posicionamento',
                  'Teste em ChatGPT, Claude e Gemini',
                  'Página Bio (Linktree)',
                  'Widget WhatsApp Octadesk',
                  'Pagamentos via Vindi',
                  'Sem badge da plataforma',
                ].map(item => (
                  <li key={item} className="flex items-start gap-3">
                    <Check className="w-4 h-4 text-brand-600 mt-0.5 shrink-0" />
                    <span className="text-sm text-gray-700">{item}</span>
                  </li>
                ))}
              </ul>
              <Link to="/cadastro" className="block w-full text-center bg-brand-600 text-white px-6 py-3 rounded-xl font-semibold hover:bg-brand-700 transition-colors shadow-md shadow-brand-200">
                Começar com Start
              </Link>
            </div>
          </div>
        </div>
      </section>

      {/* Footer */}
      <footer className="bg-gray-900 text-gray-400 py-12 px-6">
        <div className="max-w-6xl mx-auto flex flex-col md:flex-row items-center justify-between gap-4">
          <div className="flex items-center gap-2">
            <div className="w-6 h-6 bg-brand-600 rounded-md flex items-center justify-center">
              <Zap className="w-3 h-3 text-white" />
            </div>
            <span className="text-white font-semibold">Locaweb Start</span>
          </div>
          <p className="text-sm">© 2025 Locaweb Start. Todos os direitos reservados.</p>
        </div>
      </footer>
    </div>
  )
}
