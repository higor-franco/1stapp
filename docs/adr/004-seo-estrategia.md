# 004 - Estratégia de SEO e Descoberta por LLMs

**Status:** Accepted

## Context
Os sites gerados precisam ser descobertos pelo Google e também pelos LLMs (ChatGPT, Claude, Gemini) que estão sendo cada vez mais usados para pesquisa e recomendação de negócios.

## Decision
Implementar SEO em três camadas:
1. **No prompt do Gemini**: meta tags, Open Graph, viewport já são gerados na criação do site
2. **Na entrega HTTP**: injeção server-side de JSON-LD (LocalBusiness schema) via `injectJSONLD()`
3. **Plataforma**: robots.txt, sitemap.xml dinâmico, llms.txt

## Rationale
- JSON-LD injetado no servidor garante presença mesmo em sites já gerados sem ele
- llms.txt é um padrão emergente para descrever conteúdo para LLMs (semelhante ao robots.txt para crawlers)
- robots.txt explicitamente autoriza GPTBot, ClaudeBot e Googlebot
- sitemap.xml gerado dinamicamente sempre reflete o estado atual dos sites publicados

## Trade-offs
**Pros:**
- SEO automático sem esforço do usuário
- Presença em buscadores tradicionais E em LLMs
- JSON-LD server-side — funciona mesmo sem JavaScript no cliente

**Cons:**
- JSON-LD genérico (LocalBusiness) pode ser menos específico que schemas de nicho
- llms.txt é padrão não-oficial ainda em adoção

## Alternatives Considered
- **SEO só no frontend**: não funciona para páginas estáticas servidas pelo Go
- **Sitemap estático**: não reflete adições/remoções de sites em tempo real
