# TASKS — Locaweb Start

## Fase 1 — Fundação e Autenticação

| Tarefa | Status | Notas |
|--------|--------|-------|
| Scaffolding do projeto (Go + React + Postgres) | Done | mise.toml, estrutura de pastas, Dockerfile |
| Configuração do banco de dados e migrações iniciais | Done | Tabelas: users, sessions, sites, onboarding_steps |
| Sistema de autenticação (cadastro, login, sessão) | Done | Cookie HTTP-only, bcrypt, middleware requireAuth, dev login |
| Landing page da plataforma | Done | Hero, how-it-works, features, pricing cards |

## Fase 2 — Criação de Site por IA

| Tarefa | Status | Notas |
|--------|--------|-------|
| Integração com Google Gemini API | Done | gemini.go: client REST, prompt estruturado, extractHTML, 7 paletas |
| Wizard de criação de site (frontend) | Done | CreateSitePage.tsx: form → generating → preview |
| Preview do site gerado | Done | Iframe sandbox com srcDoc do HTML gerado |
| Publicação do site no subdomínio | Done | GET /site/{slug} serve HTML público pelo Go |
| Regeneração do site | Done | Limite de 3 gerações no plano Free (server-side) |
| Edição de textos do site gerado | Pendente | Interface simples de edição inline (prompt-based) |

## Fase 3 — Geração de Logo por IA

| Tarefa | Status | Notas |
|--------|--------|-------|
| Integração com Claude API para logos SVG | Done | anthropic.go: cliente REST, 3 opções em JSON, parseamento robusto |
| Interface de seleção e download de logo | Done | LogoPage.tsx: 3 cards clicáveis, seleção persistida, download SVG, upgrade wall para plano Free |

## Fase 4 — SEO e Descoberta

| Tarefa | Status | Notas |
|--------|--------|-------|
| SEO básico automático (meta tags, sitemap, robots.txt) | Done | robots.txt, sitemap.xml dinâmico, meta tags via Gemini prompt |
| SEO avançado (JSON-LD, llms.txt, Open Graph) | Done | JSON-LD LocalBusiness injetado no HTML ao servir, llms.txt com todos os sites, painel SEO no dashboard |

## Fase 5 — Pagamentos e Assinatura (Vindi)

| Tarefa | Status | Notas |
|--------|--------|-------|
| Integração com Vindi API — assinatura da plataforma | Done | vindi.go: cliente REST, createCustomer, createPaymentProfile, createSubscription |
| Fluxo de upgrade para Plano Start | Done | UpgradePage.tsx: form de cartão → POST /api/subscription/upgrade → plano atualizado |
| Webhook Vindi para atualização de status da assinatura | Done | POST /api/webhooks/vindi: bill_paid, subscription_canceled, subscription_reactivated |
| Painel de assinatura (histórico de faturas, cancelamento) | Done | SubscriptionPage.tsx + GET /api/subscription/me, POST /api/subscription/cancel |
| Add-on de pagamentos no site do cliente (Plano Start) | Done | UpsertPaymentAddon: injeta/remove botão de pagamento no HTML do site publicado |
| Interface de configuração do add-on de pagamentos | Done | PaymentAddonPage.tsx: chave Vindi, nome/valor/tipo, toggle ativo, preview do botão |

## Fase 6 — Página Bio (Linktree) e Octadesk

| Tarefa | Status | Notas |
|--------|--------|-------|
| Página Bio pública (`/bio/:slug`) | Done | bio.go: renderBioPage HTML server-side, logo SVG, WhatsApp, redes, links extras, widget Octadesk |
| Interface de configuração da Página Bio no painel | Done | BioConfigPage.tsx: WhatsApp, Instagram, Facebook, TikTok, YouTube, links extras, toggle publish, preview iframe |
| Integração Octadesk: injeção do widget no site gerado | Done | octadesk.go: injeta/remove widget no HTML do site (marcador HTML) |
| Interface de configuração Octadesk no painel | Done | OctadeskPage.tsx: cola código do widget, número WhatsApp, toggle ativo |

## Fase 7 — Domínio Personalizado

| Tarefa | Status | Notas |
|--------|--------|-------|
| Pesquisa de disponibilidade de domínio | Done | DomainPage.tsx: input + link direto para Locaweb com domínio pré-preenchido |
| Configuração de domínio personalizado | Done | POST /api/domain/configure, tabela DNS, GET /api/domain/verify (DNS lookup) |
| Roteamento por domínio personalizado no Go | Done | customDomainMiddleware: Host header → GetSiteByCustomDomain → serve HTML |

## Fase 8 — Onboarding Guiado

| Tarefa | Status | Notas |
|--------|--------|-------|
| Tela de onboarding passo a passo (Plano Start) | Done | OnboardingPage.tsx: 7 etapas, barra de progresso, "Configurar agora" / "Fazer depois", redireciona para seção do dashboard |
| Progresso persistido no banco (etapas concluídas/pendentes) | Done | computeSteps: auto-detecta conclusão a partir dos dados reais; UpsertOnboardingStep persiste |
| Banner de etapas incompletas no painel | Done | GET /api/onboarding/banner + POST /api/onboarding/dismiss + banner dismissível no DashboardPage |

## Fase 9 — Painel de Administração

| Tarefa | Status | Notas |
|--------|--------|-------|
| Dashboard principal | Done | Resumo do site, status, plano atual, banner onboarding dismissível |
| Seção "Meu Site" — alteração via prompt | Done | POST /api/sites/edit → Gemini aplica instrução → preview atualizado |
| Histórico de versões do site (últimas 5) | Done | GET /api/sites/versions + POST /api/sites/versions/{id}/restore; salvo automático antes de cada geração/edição |
| Seção "Minha Logo" | Done | LogoPage.tsx: visualizar, gerar, selecionar logo |
| Seção "Página Bio" — edição de links | Done | BioConfigPage.tsx: WhatsApp, redes sociais, preview iframe |
| Seção "Atendimento" — gerenciar Octadesk | Done | OctadeskPage.tsx: widget code, número WhatsApp, toggle |
| Seção "Pagamentos" — gerenciar Vindi | Done | PaymentAddonPage.tsx: API key, produto, ativar/desativar botão no site |
| Seção "Domínio" | Done | DomainPage.tsx: 4-step flow, DNS table, verificação de propagação |
| Seção "Assinatura" | Done | SubscriptionPage.tsx: plano, histórico de faturas, cancelamento |

## Fase 10 — Performance SEO e Presença em LLMs

| Tarefa | Status | Notas |
|--------|--------|-------|
| Integração DataForSEO (ranking Google por palavra-chave) | Done | Cliente REST com Basic Auth; opcional — usa credenciais salvas no seo_configs |
| Integração Google Search Console API | Pulado | Requer OAuth2; complexidade desproporcional para MVP |
| Configuração de palavras-chave e concorrentes | Done | GET/POST /api/seo/config — até 10 keywords e 5 domínios concorrentes |
| Relatório de posicionamento com comparativo de LLMs | Done | POST /api/seo/analyze → rank Google (DataForSEO) + presença em IA (Gemini); GET /api/seo/reports (últimos 10) |
| Teste de presença em LLMs | Done | Gemini pergunta "quais empresas de [keyword]?" e verifica se business_name aparece na resposta |
| Atualização semanal via pg_cron + notificação por e-mail | Pulado | Sem provider de e-mail configurado; análise manual disponível |

## Fase 11 — Qualidade e Conformidade

| Tarefa | Status | Notas |
|--------|--------|-------|
| Política de privacidade e LGPD | Done | CookieBanner.tsx (consentimento + localStorage) + PrivacyPage.tsx (LGPD compliant) + rota /privacidade |
| Testes automatizados (Go + Vitest) | Done | Go: TestExtractHTML, TestColorPaletteHint, TestFilterStrings, TestInjectJSONLD, TestSlugify, TestToSiteResponse, TestRegisterAndLogin (integration); Vitest: CookieBanner (5 testes) |
| Deploy em ambiente Preview (Locaweb Cloud) | Done | Dockerfile multi-stage (Node → Go → Alpine), .dockerignore, .env.example, PORT=80 |
| Deploy em produção | Pendente | Requer credenciais da plataforma Locaweb Cloud |
