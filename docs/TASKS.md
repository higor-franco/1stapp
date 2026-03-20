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
| Integração com Claude API para logos SVG | Pendente | 3 opções geradas por prompt |
| Interface de seleção e download de logo | Pendente | Exibir SVGs, botão de download |

## Fase 4 — SEO e Descoberta

| Tarefa | Status | Notas |
|--------|--------|-------|
| SEO básico automático (meta tags, sitemap, robots.txt) | Pendente | Todos os planos |
| SEO avançado (JSON-LD, llms.txt, Open Graph, hreflang) | Pendente | Exclusivo Plano Start |

## Fase 5 — Pagamentos e Assinatura (Vindi)

| Tarefa | Status | Notas |
|--------|--------|-------|
| Integração com Vindi API — assinatura da plataforma | Pendente | Criação de cliente, plano e assinatura do Plano Start |
| Fluxo de upgrade para Plano Start | Pendente | Cadastro de cartão, cobrança recorrente |
| Webhook Vindi para atualização de status da assinatura | Pendente | Ativar/desativar plano em tempo real |
| Painel de assinatura (histórico de faturas, cancelamento) | Pendente | |
| Add-on de pagamentos no site do cliente (Plano Start) | Pendente | Usuário conecta conta Vindi, configura produtos, injeta botão de pagamento no site gerado |
| Interface de configuração do add-on de pagamentos | Pendente | Formulário para chave API Vindi do cliente, nome/valor do serviço |

## Fase 6 — Página Bio (Linktree) e Octadesk

| Tarefa | Status | Notas |
|--------|--------|-------|
| Página Bio pública (`/bio/:slug`) | Pendente | Links do site, WhatsApp, redes sociais — design mobile-first |
| Interface de configuração da Página Bio no painel | Pendente | WhatsApp, links opcionais, preview |
| Integração Octadesk: injeção do widget no site gerado | Pendente | Usuário cola código do widget, plataforma injeta no HTML publicado |
| Interface de configuração Octadesk no painel | Pendente | Campo para código do widget + instruções de cadastro na Octadesk |

## Fase 7 — Domínio Personalizado

| Tarefa | Status | Notas |
|--------|--------|-------|
| Pesquisa de disponibilidade de domínio | Pendente | Exibir resultado + link para Locaweb |
| Configuração de domínio personalizado | Pendente | Usuário informa domínio, plataforma exibe DNS |
| Roteamento por domínio personalizado no Go | Pendente | Identificar site pelo Host header |

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
