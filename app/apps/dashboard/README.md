# Dashboard (Arki)

App principal autenticado, com UI e API via Next.js Route Handlers em `app/api/`. Roda na porta 3000.

## Como rodar

Da raiz do monorepo:

```bash
bun --cwd apps/dashboard run dev
```

Se o banco ainda não estiver pronto:

```bash
bun run quickstart
docker compose up
bun --cwd packages/database run migrate
```

## Padrão atual

- RSC-first: pages e layouts leem dados no servidor.
- Feature co-location: cada domínio vive em `features/<name>/`.
- Data em `data/`: leituras server-only ficam em `features/<name>/data/get-*.ts`.
- Mutations em `actions/`: writes usam Server Actions com `next-safe-action`.
- Auth no layout, não no middleware: `(protected)/layout.tsx` usa `getAuthContext()`.
- Rotas centralizadas: usar `routes.*` e `api.*` de `@workspace/routes`.

## Protótipo: Central de Seleção e Compatibilidade IEL

Área de demonstração isolada em `/iel`, com base fictícia e estado local no
navegador. Não usa banco, sessão nem integrações externas.

```bash
# Env mínimo: copiar o exemplo já é suficiente (nenhuma chave de terceiros).
# NEXT_PUBLIC_DASHBOARD_URL, AUTH_SECRET e DATABASE_URL só satisfazem a
# validação de env do monorepo; a demonstração não consulta o banco.
cp apps/dashboard/.env.example apps/dashboard/.env
bun --cwd apps/dashboard run dev
# abrir http://localhost:3000/iel
```

- Rotas: `routes.dashboard.iel.*` em `@workspace/routes`.
- Domínio, fixtures e estado: `features/iel-demo/` (`fixtures/`, `state/`,
  `analysis/`). A base inicial tem 3 empresas, 3 vagas, 8 talentos e 10
  candidaturas, com datas fixas.
- Telas: `components/iel-demo/` (visão geral, vagas, mesa de seleção, perfil,
  comparação, empresas, pendências, experiência do destinatário,
  encaminhamento, visão da empresa e fontes de dados).
- Persona da demonstração: barra "Visualizar como — demonstração" (recorte de
  dados, não autenticação).
- Testes: `features/iel-demo/state/demo-journey.test.ts` (regras de estado) e
  `e2e/iel-demo/iel-demo-journey.spec.ts` (jornada completa no navegador).

## Referências locais

- Guia de feature: [AGENTS.md](./AGENTS.md) (seção Feature pattern: data/ + actions/)
- Convenções de rotas API: [../../docs/api-routes-nextjs.md](../../docs/api-routes-nextjs.md)
- Definition of Done do repo: [../../docs/repo-definition-of-done.md](../../docs/repo-definition-of-done.md)
