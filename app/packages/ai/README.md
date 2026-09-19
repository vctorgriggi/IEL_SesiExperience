# `@workspace/ai`

Domínio do chat com IA: conversas, mensagens e créditos. Fica num pacote, e não
dentro de um app, porque dois apps precisam do mesmo comportamento: o `ai-chat`
lê e escreve durante a conversa, e o `dashboard` credita a compra quando o
webhook de pagamento chega.

Todas as funções são server-only e recebem `userId`: a checagem de posse mora
aqui, então nenhuma rota precisa lembrar de filtrar por usuário.

```ts
import {
  listConversations,
  upsertAssistantMessage,
  consumeAiMessage,
  refundAiMessage
} from '@workspace/ai';

const page = await listConversations({ userId, limit: 30 });

// Cobrar antes de gerar e devolver se a geração falhar.
const charge = await consumeAiMessage(userId);
if (!charge.ok) return; // sem saldo
try {
  const text = await generate();
  await upsertAssistantMessage({ conversationId, userId, content: text });
} catch {
  await refundAiMessage(userId, charge.source);
}
```

## Créditos

- Cada usuário ganha uma cota gratuita na primeira mensagem (`AI_CHAT_FREE_MESSAGES`, padrão 20).
- O consumo gasta primeiro a cota gratuita, depois os créditos comprados, com
  decremento atômico: duas abas enviando ao mesmo tempo não furam o saldo.
- `consumeAiMessage` devolve de qual bolso saiu (`free` ou `credits`) para o
  estorno cair no lugar certo.
- Todo movimento vira um lançamento em `ai_credit_ledger` (`use`, `purchase`,
  `grant`, `refund`), então o saldo é sempre auditável.
- A compra é creditada de forma idempotente pela transição `pending -> paid`:
  webhook repetido não credita duas vezes.

## Rate limit

`src/rate-limit.ts` concentra os limites por usuário. O padrão é em memória
(vale por processo); em produção com várias instâncias, troque pelo
`redisRateLimiter` de `@workspace/rate-limit/redis`.
