# PRD — Locaweb Start

## Visão Geral

**Locaweb Start** é uma plataforma SaaS brasileira de criação de sites com inteligência artificial. Com um simples prompt em português, qualquer pessoa — mesmo sem conhecimento técnico — gera um site profissional completo em segundos, com hospedagem inclusa, logo personalizada e configurações de SEO automáticas para aparecer no Google e nos LLMs.

A proposta de valor central é: **do prompt ao site publicado em menos de 2 minutos**, tudo dentro de uma única plataforma.

---

## Público-Alvo

- Pequenos empreendedores e autônomos brasileiros
- Profissionais liberais (advogados, médicos, consultores, etc.)
- Donos de micro e pequenas empresas que precisam de presença online rápida
- Pessoas sem conhecimento técnico que querem um site profissional sem contratar um desenvolvedor

---

## Planos

### Plano Free
- 1 site hospedado na plataforma
- Subdomínio gratuito: `nome-do-negocio.locawebstart.com.br`
- Geração de site por IA (até 3 gerações/regenerações por mês)
- Geração de logo por IA (1 logo por mês)
- SEO básico automático (meta tags, sitemap, robots.txt)
- Badge "Criado com Locaweb Start" visível no site
- Sem domínio personalizado
- Sem suporte prioritário

### Plano Start (pago — assinatura mensal via Vindi)
- 1 site hospedado na plataforma
- Subdomínio gratuito incluso
- Suporte a domínio personalizado (usuário compra na Locaweb, configura aqui)
- Geração de site por IA (ilimitada)
- **Alterações no site via prompt** (re-geração dirigida por instrução em linguagem natural)
- Geração de logo por IA (ilimitada)
- SEO avançado automático (dados estruturados JSON-LD, llms.txt, Open Graph, otimização para LLMs)
- **Painel de Performance SEO**: relatório de posicionamento no Google com acompanhamento dos 5 principais concorrentes (via DataForSEO + Google Search Console)
- **Teste de posicionamento em LLMs**: verifica como ChatGPT, Claude e Gemini citam o negócio em buscas relevantes
- **Add-on de pagamentos Vindi**: o dono do site pode ativar recebimento de pagamentos diretamente no seu site gerado (cobranças únicas ou recorrentes para os clientes dele)
- **Página Bio (Linktree)**: página pública estilo linktree em `locawebstart.com.br/bio/slug` com links do site, WhatsApp e redes sociais — ideal para bio do Instagram
- **Widget de atendimento Octadesk**: integração com chat oficial WhatsApp via Octadesk — widget de atendimento injetado no site e número de WhatsApp exibido na página Bio
- Sem badge da plataforma
- Suporte prioritário por e-mail

---

## Funcionalidades Principais

### 1. Criação de Site por IA (Google Gemini API)
- Usuário descreve seu negócio em linguagem natural (ex: "Sou fotógrafa de casamentos em São Paulo, atendo noivas de alto padrão")
- A plataforma envia o prompt para a API do Google Gemini
- Gemini gera o HTML/CSS/JS completo de um site responsivo e profissional
- O site gerado é previamente exibido ao usuário antes de publicar
- Usuário pode regenerar ou editar textos/cores diretamente

### 2. Geração de Logo por IA (Claude API)
- A partir do nome do negócio e descrição, Claude gera opções de logo em SVG
- Usuário escolhe e faz download da logo preferida
- Logo pode ser usada no site gerado e exportada livremente

### 3. Hospedagem Inclusa (Locaweb Cloud via cofounder)
- Sites ficam hospedados na infraestrutura Locaweb Cloud
- Subdomínio automático no padrão `slug-do-negocio.locawebstart.com.br`
- Sites são arquivos estáticos (HTML/CSS/JS) servidos pelo backend Go

### 4. Domínio Personalizado (redirecionamento para Locaweb)
- Exclusivo do Plano Start
- Usuário pesquisa disponibilidade de domínio dentro da plataforma
- Ao clicar em "Comprar", é redirecionado para a Locaweb com o domínio pré-selecionado
- Após adquirir, configura o domínio na plataforma informando o domínio comprado
- Plataforma exibe instruções de configuração de DNS (apontar para nosso IP)

### 5. Pagamentos via Vindi API

A Vindi é usada em **dois contextos distintos** na plataforma:

#### 5a. Assinatura da plataforma (interno)
- Cobrança mensal recorrente do Plano Start via Vindi
- Cadastro de cartão de crédito no fluxo de upgrade
- Gerenciamento de assinatura: upgrade, cancelamento
- Histórico de faturas acessível no painel do usuário
- Webhook da Vindi atualiza status da assinatura em tempo real

#### 5b. Add-on de pagamentos no site do cliente (exclusivo Plano Start)
- O dono do site pode ativar um módulo de pagamentos para o seu próprio negócio
- Ele conecta sua conta Vindi (ou cria uma) e configura seus produtos/serviços/planos
- O site gerado passa a incluir um botão/formulário de pagamento funcional
- Os clientes do dono do site podem pagar diretamente no site (cobranças únicas ou assinaturas)
- O dono do site gerencia seus recebimentos pelo painel da Vindi (fora da nossa plataforma)
- A plataforma armazena apenas o token de API Vindi do cliente para fazer chamadas em nome dele

### 6. Página Bio — Linktree (exclusivo Plano Start)

Uma página pública simples e elegante no endereço `locawebstart.com.br/bio/slug-do-negocio`, projetada para ser colocada na bio do Instagram e outras redes sociais.

**Conteúdo da página Bio:**
- Foto/logo do negócio
- Nome e descrição curta do negócio
- Botão "Visitar meu site" → link para o site gerado
- Botão "Falar no WhatsApp" → link direto `wa.me/` com o número do cliente
- Links adicionais opcionais (Instagram, Facebook, etc.)
- Design responsivo e mobile-first (pensada para acesso via celular)

O usuário configura os links no painel da plataforma. A página Bio é hospedada e servida pela própria plataforma.

### 7. Widget de Atendimento Octadesk (exclusivo Plano Start)

Integração com a plataforma **Octadesk** para oferecer atendimento via WhatsApp Oficial e chat no site.

**Como funciona:**
- O usuário cria ou conecta sua conta Octadesk (redirecionamos para `octadesk.com` para cadastro/login)
- Na Octadesk, o usuário obtém seu número oficial de WhatsApp Business e configura seu atendimento
- Na nossa plataforma, o usuário cola o **código do widget Octadesk** (fornecido pela Octadesk no painel deles)
- A plataforma injeta automaticamente o widget de chat no site gerado do usuário
- O número de WhatsApp configurado também aparece na **Página Bio** do usuário

**Resultado para os visitantes do site:**
- Botão de chat flutuante no site (widget Octadesk) para iniciar atendimento via WhatsApp
- Link direto de WhatsApp na página Bio

### 8. SEO e Descoberta por LLMs e Google
- **Para todos os planos:**
  - `<title>` e `<meta description>` otimizados automaticamente
  - `sitemap.xml` gerado automaticamente
  - `robots.txt` configurado
  - Tags Open Graph para redes sociais
- **Exclusivo Plano Start:**
  - Dados estruturados JSON-LD (Schema.org: LocalBusiness, Person, etc.)
  - Arquivo `llms.txt` com descrição semântica do negócio para LLMs
  - Tags de idioma e região brasileira (`hreflang`, `geo.region`)
  - Atributos `alt` em imagens e estrutura semântica HTML5

### 9. Onboarding Guiado (Plano Start)

Após a criação do site, o usuário do Plano Start passa por um **onboarding passo a passo** que apresenta e ativa cada funcionalidade da plataforma. Cada etapa é opcional e pode ser concluída depois pelo painel.

**Etapas do onboarding:**
1. ✅ **Site criado** — preview e publicação (já concluído)
2. 🎨 **Gere sua logo** — geração de logo com IA
3. 🔗 **Monte sua Página Bio** — configurar links para Instagram
4. 💬 **Conecte o WhatsApp** — integração Octadesk
5. 💳 **Ative pagamentos no site** — conectar conta Vindi
6. 🌐 **Adicione seu domínio** — comprar na Locaweb e configurar
7. 🔍 **Configure o SEO** — palavras-chave e concorrentes para acompanhamento

Cada etapa exibe: o que é, por que é importante e o botão para configurar agora ou "Fazer depois".

### 10. Painel de Administração (Plano Start)

O painel centraliza o gerenciamento de todas as funcionalidades após o onboarding.

**Seções do painel:**

#### 10a. Meu Site
- Preview do site publicado
- **Alterar o site via prompt**: usuário descreve a mudança em linguagem natural (ex: "adicione uma seção de depoimentos" ou "mude as cores para azul marinho") e Gemini regenera o site incorporando a instrução
- Histórico de versões do site (últimas 5 versões, possibilidade de restaurar)
- Link do site e status de publicação

#### 10b. Performance SEO e Presença nas LLMs
- **Relatório de posicionamento Google**: ranking do site para as palavras-chave principais, com gráfico de evolução semanal
- **Comparativo com 5 concorrentes**: ranking dos concorrentes nas mesmas palavras-chave (usuário informa os domínios dos concorrentes)
- **Teste de presença em LLMs**: a plataforma consulta ChatGPT (OpenAI API), Claude (Anthropic API) e Gemini (Google API) com perguntas relevantes ao negócio (ex: "Qual é a melhor clínica de estética em São Paulo?") e exibe se e como o negócio do usuário é mencionado nas respostas
- Relatório atualizado semanalmente, com alertas de mudanças relevantes de posição

#### 10c. Minha Logo
- Logos geradas, download em SVG
- Gerar nova logo

#### 10d. Página Bio (Linktree)
- Editar links (site, WhatsApp, redes sociais)
- Preview da página Bio
- Link para copiar e usar na bio do Instagram

#### 10e. Atendimento (Octadesk)
- Status da integração Octadesk
- Atualizar código do widget
- Atualizar número de WhatsApp exibido na Bio

#### 10f. Pagamentos (Vindi)
- Status da conexão com conta Vindi do cliente
- Configurar/editar produtos e valores cobrados no site
- Ativar/desativar botão de pagamento no site

#### 10g. Domínio
- Status do domínio personalizado
- Instruções de DNS
- Verificação de propagação

---

## Fluxos do Usuário

### Fluxo de Onboarding (Plano Start — após upgrade)
1. Após ativar o Plano Start, usuário entra na tela de onboarding
2. Vê as 7 etapas com status (concluída / pendente)
3. Clica em cada etapa para configurar ou pula para "Fazer depois"
4. Ao concluir todas as etapas, vai direto ao Painel de Administração
5. Etapas incompletas ficam sinalizadas no painel com um banner de convite

### Fluxo de Alteração do Site via Prompt
1. No painel, usuário acessa "Meu Site" → "Alterar site"
2. Digita a instrução em linguagem natural (ex: "Adicione um formulário de contato no final da página")
3. Gemini recebe o HTML atual + instrução e devolve o site atualizado
4. Usuário visualiza o preview da nova versão
5. Confirma para publicar ou descarta — versão anterior fica salva no histórico

### Fluxo do Relatório de SEO e LLMs
1. No painel, usuário acessa "Performance SEO"
2. Na primeira vez: informa as palavras-chave principais e os domínios de até 5 concorrentes
3. Plataforma dispara as consultas (DataForSEO para Google + APIs das LLMs)
4. Exibe relatório: posição no Google por palavra-chave, comparativo com concorrentes, e como cada LLM responde a perguntas sobre o segmento do negócio
5. Relatório é atualizado semanalmente (via pg_cron) e usuário recebe e-mail com resumo das mudanças

### Fluxo de Cadastro e Primeira Criação
1. Usuário acessa a landing page da plataforma
2. Clica em "Criar meu site grátis"
3. Faz cadastro com e-mail e senha
4. É direcionado ao wizard de criação:
   a. Informa nome do negócio
   b. Descreve o negócio com suas palavras (prompt livre)
   c. Escolhe uma paleta de cores (opcional)
5. IA gera o site (loading com feedback visual)
6. Usuário visualiza o preview do site
7. Pode regenerar, editar textos ou publicar
8. Ao publicar: site fica disponível no subdomínio gratuito
9. Usuário é convidado a fazer upgrade para o Plano Start

### Fluxo de Geração de Logo
1. No painel, usuário acessa "Minha Logo"
2. Confirma nome do negócio e adiciona palavras-chave (ex: "moderno, verde, confiança")
3. Claude gera 3 opções de logo em SVG
4. Usuário escolhe e baixa, ou regenera

### Fluxo de Upgrade para Plano Start
1. Usuário clica em "Fazer upgrade"
2. Preenche dados do cartão de crédito
3. Vindi processa a assinatura mensal
4. Plataforma libera funcionalidades: domínio personalizado, SEO avançado, sem badge

### Fluxo da Página Bio
1. No painel, usuário acessa "Minha Página Bio"
2. Informa o número do WhatsApp (com DDD)
3. Adiciona links opcionais (Instagram, Facebook, etc.)
4. Salva — página Bio fica disponível em `locawebstart.com.br/bio/slug`
5. Plataforma exibe o link para copiar e colocar na bio do Instagram

### Fluxo de Integração Octadesk
1. No painel, usuário acessa "Atendimento WhatsApp"
2. Plataforma exibe instruções: "Crie sua conta na Octadesk e obtenha seu número oficial de WhatsApp"
3. Botão "Criar conta na Octadesk" abre `octadesk.com` em nova aba
4. Após configurar na Octadesk, usuário volta e cola o código do widget Octadesk no campo indicado
5. Plataforma injeta o widget no site publicado do usuário
6. Usuário informa o número de WhatsApp para exibir na Página Bio

### Fluxo de Ativação do Add-on de Pagamentos (Plano Start)
1. No painel, usuário acessa "Pagamentos no meu site"
2. Informa sua chave de API da Vindi (ou é guiado a criar uma conta Vindi)
3. Configura o que quer cobrar: nome do serviço/produto e valor (cobrança única ou recorrente)
4. Plataforma gera e injeta um botão/formulário de pagamento no site publicado
5. Quando um visitante do site clica e paga, a transação corre direto na conta Vindi do dono do site
6. Dono do site acompanha recebimentos no painel da Vindi

### Fluxo de Domínio Personalizado
1. Usuário acessa "Domínio" no painel
2. Digita o domínio desejado (ex: `minhaempresa.com.br`)
3. Plataforma verifica disponibilidade (via Locaweb)
4. Se disponível: botão "Comprar na Locaweb" abre nova aba na página de registro da Locaweb
5. Após comprar, usuário volta e informa o domínio adquirido
6. Plataforma exibe instruções de DNS para apontar para o servidor
7. Quando DNS propaga, site passa a responder no domínio personalizado

---

## Requisitos Não-Funcionais

- Interface 100% em português brasileiro
- Sites gerados devem ser responsivos (mobile-first)
- Geração do site em menos de 30 segundos
- Conformidade com LGPD (política de privacidade, consentimento de cookies)
- Uptime mínimo de 99,5%
- Autenticação segura com sessão por cookie HTTP-only

---

## Fora do Escopo (v1)

- App mobile nativo
- Editor visual drag-and-drop (apenas edição de textos na v1)
- E-commerce / loja virtual completa (catálogo, carrinho, estoque)
- Blog integrado
- Múltiplos sites por usuário (v1 = 1 site por conta)
- Integração direta com API de registro de domínio da Locaweb
- Integração com redes sociais
- Analytics de tráfego do site (Google Analytics)
- Editor visual drag-and-drop
