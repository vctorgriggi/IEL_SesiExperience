# `@workspace/rate-limit`

Rate limiting com dois backends: memória do processo e Redis.

## Uso

```ts
import { createRateLimiter } from '@workspace/rate-limit';

const limiter = createRateLimiter({ intervalInMs: 60_000 });
const { isRateLimited } = await limiter.check(20, `chat:${userId}`);
if (isRateLimited) {
  // 429
}
```

`check(requestLimit, id)` permite `requestLimit` requisições na janela; a
seguinte é barrada.

## Backends

`createRateLimiter` escolhe pelo ambiente: Redis quando
`RATE_LIMIT_REDIS_URL` (ou `REDIS_URL`) está definida, memória caso contrário.

```ts
import { inMemoryRateLimiter } from '@workspace/rate-limit/in-memory';
import { redisRateLimiter } from '@workspace/rate-limit/redis';
```

## Deploy

O backend em memória conta **por processo**. Num deploy serverless ou com
várias instâncias, cada processo tem seu próprio contador e o limite real vira
N vezes o configurado. Para qualquer coisa que custe dinheiro (geração de IA,
envio de e-mail, criação de cobrança), configure o Redis em produção.

Se o Redis cair, a requisição passa e o erro é registrado: indisponibilidade de
infraestrutura de limite não derruba o produto.
