# 002 - Claude API para Geração de Logos

**Status:** Accepted

## Context
A plataforma precisa gerar logos profissionais em SVG a partir do nome e descrição do negócio do usuário.

## Decision
Usar a **API do Claude (Anthropic)** para geração de logos SVG.

## Rationale
- Claude tem excelente capacidade de gerar SVG semântico e profissional
- SVG é o formato ideal para logos: escalável, leve, editável
- Geração de 3 opções por prompt permite ao usuário escolher

## Trade-offs
**Pros:**
- SVG vetorial — qualidade perfeita em qualquer tamanho
- Sem necessidade de armazenar imagens grandes
- Claude gera código SVG limpo e reutilizável

**Cons:**
- Logos SVG gerados por texto podem ter limitações visuais comparado a modelos de imagem
- Dependência de serviço externo (Anthropic)

## Alternatives Considered
- **DALL-E / GPT-4o:** Gera imagens rasterizadas (PNG), não vetoriais
- **Stable Diffusion:** Requereria infraestrutura própria de GPU
