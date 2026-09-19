# tools/env-check

Ferramentas de ambiente. Executar da **raiz do repositório** (paths são relativos ao cwd).

- **env-doctor.ts** — Valida variáveis de ambiente em todos os apps. `bun run tools/env-check/env-doctor.ts`
- **quickstart.ts** — Copia .env.example, sincroniza DATABASE_URL/AUTH_SECRET, roda env:doctor. `bun run quickstart`
