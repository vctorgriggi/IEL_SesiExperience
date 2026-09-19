# Repository Definition of Done

Uma entrega no Arki só está pronta quando estes itens foram validados no escopo afetado:

- Build: `bun run build`
- Lint: `bun run lint`
- Typecheck: `bun run typecheck`
- Testes: `bun run test` e, quando houver fluxo crítico no dashboard, `bun --filter @workspace/dashboard test:e2e`
- Release: envs revisados, migrações conferidas, docs/scripts atualizados e checklist de deploy aplicável revisado

## Documentação das telas do protótipo IEL

Toda alteração que muda o comportamento visível de uma tela em `/iel` atualiza o arquivo da tela em
`docs/telas/` no mesmo PR: bloco novo ou removido, mudança no que a tela calcula ou mostra, ação
nova do usuário, mudança de persona, mudança de origem de dado ou de regra de conformidade.
Refatoração sem efeito visível não exige atualização.

Tela nova exige arquivo novo em `docs/telas/`, numerado na sequência, mais a linha no índice
`docs/telas/00-indice.md`. O modelo do arquivo está nesse mesmo índice.

## Regra prática

- Mudança sem impacto de runtime: lint + typecheck podem ser suficientes.
- Mudança em schema, auth, billing, API ou jornada principal: build + lint + typecheck + testes relevantes são obrigatórios.
- Mudança que altera onboarding, deploy ou operação: README e docs locais devem ser atualizados no mesmo PR.
