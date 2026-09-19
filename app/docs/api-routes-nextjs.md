# Next.js API Routes

Convenções para Route Handlers em `apps/dashboard/app/api/`.

## Regras

- Criar um `route.ts` por segmento.
- Exportar apenas os verbos necessários: `GET`, `POST`, `PATCH`, `PUT`, `DELETE`.
- Validar entrada com Zod.
- Usar `@workspace/database` ou queries compartilhadas da feature, sem duplicar regra de negócio na rota.
- Para recursos protegidos, resolver sessão/contexto no próprio handler ou em util server-only.
- Para webhooks e downloads, usar rota HTTP; para mutations internas do app, preferir Server Actions.

## Checklist rápido

1. A rota tem validação de entrada e saída?
2. O acesso usa helpers compartilhados e não strings hardcoded de rota?
3. O caso deveria ser Server Action em vez de rota HTTP?
4. Houve cobertura mínima de teste ou validação manual?
