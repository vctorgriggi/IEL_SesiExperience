# Testing

## Comandos

- `bun run test`: roda a suite registrada no Turbo.
- `bun run test:coverage`: roda a suite completa com cobertura e valida os thresholds do `vitest.config.ts` (também roda no CI).
- `bun --cwd apps/dashboard run test:e2e`: roda os E2E do dashboard com Playwright.
- `RUN_AI_INTEGRATION_TESTS=1 bun run test`: habilita os testes de crédito do chat (`packages/ai`) contra Postgres real. O que garante o saldo ali é SQL (decremento condicional dentro de transação), então esses casos, incluindo o de envios simultâneos, só provam alguma coisa com banco de verdade.

## Pré-requisitos

- Para testes que usam banco, configure `DATABASE_URL` válida.
- `vitest.setup.ts` injeta `AUTH_SECRET` com tamanho mínimo para a maioria dos testes.
- `vitest.setup.ts` também injeta `API_URL` (`http://localhost:3002`) para cenários que esperam endpoint de API.
- `server-only` é substituído por um módulo vazio no `vitest.config.ts`: o pacote serve para o bundler barrar import no cliente e lança se importado nos testes. Assim dá para testar módulo de servidor direto.
- Para E2E, deixe o banco disponível antes de executar o comando.

## Quando rodar o quê

- Mudanças de UI isoladas: `bun run test` se houver cobertura local.
- Mudanças em auth, rotas API, schema ou fluxos críticos: `bun run test` e `bun --cwd apps/dashboard run test:e2e`.
