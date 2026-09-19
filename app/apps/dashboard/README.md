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

## Referências locais

- Guia de feature: [AGENTS.md](./AGENTS.md) (seção Feature pattern: data/ + actions/)
- Convenções de rotas API: [../../docs/api-routes-nextjs.md](../../docs/api-routes-nextjs.md)
- Definition of Done do repo: [../../docs/repo-definition-of-done.md](../../docs/repo-definition-of-done.md)
