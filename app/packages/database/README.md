# @workspace/database

Schema, cliente e tipos do banco. Drizzle ORM sobre PostgreSQL, com os schemas
divididos por domínio em `src/schemas/<domínio>/` (veja
`src/schemas/README.md` para as convenções de tabela, enum e índice).

## Uso

```typescript
import { db, eq, eventTable } from '@workspace/database';

const [event] = await db
  .insert(eventTable)
  .values({ title: 'Meu evento', startDate: new Date(), createdById: userId })
  .returning();

const meus = await db
  .select()
  .from(eventTable)
  .where(eq(eventTable.createdById, userId));
```

O pacote reexporta os operadores do `drizzle-orm` (`eq`, `and`, `desc`, …), então
o consumidor importa tudo de um lugar só.

## Variáveis de ambiente

- `DATABASE_URL`: string de conexão PostgreSQL.

O app de chat usa `pgvector` na base de conhecimento. Em desenvolvimento o
`docker-compose.yml` da raiz já sobe a imagem certa; em Postgres gerenciado,
confirme que `CREATE EXTENSION vector` é permitido antes de migrar.

## Comandos

Todos rodam a partir da raiz do monorepo com `bun --filter @workspace/database <script>`.

| Script | O que faz |
|---|---|
| `generate` | Gera a migração a partir das mudanças no schema |
| `migrate` | Aplica as migrações pendentes |
| `push` | Empurra o schema direto para o banco, sem migração (só em desenvolvimento) |
| `studio` | Abre o Drizzle Studio |
| `seed-demo` | Cria a conta de demonstração usada pelo app de chat |
| `seed-events` | Popula eventos de exemplo numa organização existente |

### Fluxo ao mudar o schema

```bash
bun --filter @workspace/database generate   # revise o SQL gerado antes de aplicar
bun --filter @workspace/database migrate
```

A migração gerada é um arquivo SQL comum: dá para editá-la à mão quando precisar
de algo que o gerador não expressa, como criar uma extensão.

### Recomeçar o banco local

```bash
docker compose down -v && docker compose up -d
bun --filter @workspace/database migrate
```
