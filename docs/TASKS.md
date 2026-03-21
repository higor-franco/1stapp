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
| Tela de onboarding passo a passo (Plano Start) | Pendente | 7 etapas: site, logo, bio, WhatsApp, pagamentos, domínio, SEO |
| Progresso persistido no banco (etapas concluídas/pendentes) | Pendente | |
| Banner de etapas incompletas no painel | Pendente | |

## Fase 9 — Painel de Administração

| Tarefa | Status | Notas |
|--------|--------|-------|
| Dashboard principal | Pendente | Resumo do site, status, plano atual, etapas do onboarding |
| Seção "Meu Site" — alteração via prompt | Pendente | Instrução em linguagem natural → Gemini regenera → preview → publicar |
| Histórico de versões do site (últimas 5) | Pendente | Possibilidade de restaurar versão anterior |
| Seção "Minha Logo" | Pendente | Visualizar logos, baixar SVG, gerar nova |
| Seção "Página Bio" — edição de links | Pendente | WhatsApp, redes sociais, preview |
| Seção "Atendimento" — gerenciar Octadesk | Pendente | Atualizar widget, número de WhatsApp |
| Seção "Pagamentos" — gerenciar Vindi | Pendente | Conexão, produtos, ativar/desativar botão no site |
| Seção "Domínio" | Pendente | Status, instruções DNS, verificação de propagação |
| Seção "Assinatura" | Pendente | Plano atual, histórico de faturas, cancelamento |

## Fase 10 — Performance SEO e Presença em LLMs

| Tarefa | Status | Notas |
|--------|--------|-------|
| Integração DataForSEO (ranking Google por palavra-chave) | Pendente | A definir — aguardando confirmação da API preferida |
| Integração Google Search Console API | Pendente | Dados reais do site: cliques, impressões, CTR |
| Configuração de palavras-chave e concorrentes | Pendente | Usuário informa até 5 domínios concorrentes |
| Relatório de posicionamento com comparativo de concorrentes | Pendente | Gráfico de evolução semanal |
| Teste de presença em LLMs (ChatGPT, Claude, Gemini) | Pendente | APIs: OpenAI, Anthropic, Google — consulta perguntas do segmento |
| Atualização semanal via pg_cron + notificação por e-mail | Pendente | Resumo de mudanças de posição |

## Fase 11 — Qualidade e Conformidade

| Tarefa | Status | Notas |
|--------|--------|-------|
| Política de privacidade e LGPD | Pendente | Banner de cookies, página de política |
| Testes automatizados (Go + Vitest) | Pendente | Cobertura dos handlers e componentes principais |
| Deploy em ambiente Preview (Locaweb Cloud) | Pendente | |
| Deploy em produção | Pendente | |
