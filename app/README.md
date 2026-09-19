# Arki

Starter kit SaaS em monorepo com Bun, Turborepo, Next.js 15, Auth.js (next-auth) e Drizzle.

## Pré-requisitos

- Bun 1.2.4+
- Node.js 20+
- Docker opcional, apenas para subir Postgres local

> Os comandos por workspace usam `bun --filter <nome-do-workspace> <script>`.
> A forma antiga `bun --cwd <caminho> run <script>` deixou de existir no Bun 1.4.

## Onboarding técnico em 30 minutos

Na raiz do repo:

```bash
bun install
bun run quickstart
```

Se for usar Postgres local, em outro terminal:

```bash
docker compose up
```

Depois:

```bash
bun --filter @workspace/database migrate
bun --filter @workspace/dashboard dev
```

URLs locais:

- Dashboard: http://localhost:3000
- Protótipo IEL: http://localhost:3000/iel

`bun run quickstart` copia `.env.example` para `.env` quando necessário, sincroniza `DATABASE_URL`, gera `AUTH_SECRET` e roda a validação de ambiente.

## Comandos que existem hoje

| Comando | O que faz |
| --- | --- |
| `bun run quickstart` | Prepara os `.env` do repo |
| `bun run build` | Build do monorepo via Turbo |
| `bun run lint` | Lint do monorepo e consistência de workspaces |
| `bun run typecheck` | Typecheck do monorepo |
| `bun run test` | Suite de testes registrada no Turbo |
| `bun --filter @workspace/dashboard dev` | Sobe só o dashboard |
| `bun --filter @workspace/database migrate` | Aplica migrações do Drizzle |
| `bun --filter @workspace/database generate` | Gera novas migrações |
| `bun --filter @workspace/database push` | Sincroniza schema sem histórico |
| `bun --filter @workspace/database studio` | Abre o Drizzle Studio |
| `bun --filter @workspace/dashboard test:e2e` | Roda os E2E do dashboard |

## Documentação local

- [PATTERNS.md](./PATTERNS.md): padrões de organização do repo.
- [docs/repo-definition-of-done.md](./docs/repo-definition-of-done.md): Definition of Done curto do repo.
- [docs/testing.md](./docs/testing.md): como rodar testes e o que depende de banco.
- [docs/deploy-checklist.md](./docs/deploy-checklist.md): checklist objetivo de deploy.
- [docs/api-routes-nextjs.md](./docs/api-routes-nextjs.md): convenções para Route Handlers no dashboard.
- [apps/dashboard/AGENTS.md](./apps/dashboard/AGENTS.md): padrão de feature no dashboard.
- [AGENTS.md](./AGENTS.md): contexto para agentes e IDEs.

## Release

Antes de abrir PR ou cortar release, use o checklist em [docs/repo-definition-of-done.md](./docs/repo-definition-of-done.md).

## Troubleshooting

- `service postgres is unhealthy`: rode `docker compose down -v` e depois `docker compose up`.
- `ECONNREFUSED` no banco: suba o Postgres local ou aponte `DATABASE_URL` para um banco remoto válido.
- `role "arki_user" does not exist`: remova o volume do Postgres e suba o container de novo.
- Porta 5432 ocupada: troque a porta em [docker-compose.yml](./docker-compose.yml) e reflita isso na `DATABASE_URL`.
