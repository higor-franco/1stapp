# 001 - Google Gemini para Geração de Sites

**Status:** Accepted

## Context
A plataforma precisa gerar sites completos (HTML/CSS/JS responsivos) a partir de um prompt em linguagem natural. É necessário um modelo de IA capaz de produzir código HTML de alta qualidade e design profissional.

## Decision
Usar a **API do Google Gemini** para geração do HTML/CSS/JS dos sites.

## Rationale
- O usuário já definiu Gemini como a IA de geração de sites
- Gemini é capaz de gerar código HTML/CSS responsivo e profissional em um único prompt
- Custo competitivo para o volume esperado de geração

## Trade-offs
**Pros:**
- Geração de sites completos em uma única chamada de API
- Suporte a instruções em português
- Qualidade de output adequada para landing pages

**Cons:**
- Dependência de serviço externo (Google)
- Custos variáveis conforme volume de gerações

## Alternatives Considered
- **Claude (Anthropic):** Excelente para código, mas reservado para geração de logos nesta plataforma
- **GPT-4 (OpenAI):** Não escolhido — usuário optou por Gemini
