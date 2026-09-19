# Repository Definition of Done

Uma entrega no Arki só está pronta quando estes itens foram validados no escopo afetado:

- Build: `bun run build`
- Lint: `bun run lint`
- Typecheck: `bun run typecheck`
- Testes: `bun run test` e, quando houver fluxo crítico no dashboard, `bun --cwd apps/dashboard run test:e2e`
- Release: envs revisados, migrações conferidas, docs/scripts atualizados e checklist de deploy aplicável revisado

## Regra prática

- Mudança sem impacto de runtime: lint + typecheck podem ser suficientes.
- Mudança em schema, auth, billing, API ou jornada principal: build + lint + typecheck + testes relevantes são obrigatórios.
- Mudança que altera onboarding, deploy ou operação: README e docs locais devem ser atualizados no mesmo PR.
