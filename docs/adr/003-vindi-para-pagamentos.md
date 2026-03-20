# 003 - Vindi para Pagamentos e Assinaturas

**Status:** Accepted

## Context
A plataforma precisa cobrar assinaturas mensais recorrentes dos usuários do Plano Start, com gestão de cartões, histórico de faturas e webhooks para atualização de status em tempo real.

## Decision
Usar a **API da Vindi** para processamento de pagamentos e gestão de assinaturas.

## Rationale
- Solução brasileira com suporte nativo a reais (BRL) e métodos de pagamento locais
- API REST bem documentada para clientes, planos, assinaturas e cobranças
- Webhooks para eventos de pagamento (aprovado, recusado, cancelado)
- Conformidade com regulamentações brasileiras de meios de pagamento

## Trade-offs
**Pros:**
- Focada no mercado brasileiro
- Suporte a cartões de crédito, boleto e Pix (via configuração)
- Gerenciamento de retry automático de cobranças recusadas

**Cons:**
- Menos conhecida internacionalmente que Stripe
- Requer conta e aprovação na Vindi

## Alternatives Considered
- **Stripe:** Internacional, ótima API, mas sem suporte nativo a boleto/Pix
- **PagSeguro/MercadoPago:** Mais orientados a e-commerce que SaaS recorrente
