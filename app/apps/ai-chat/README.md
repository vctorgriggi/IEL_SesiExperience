# AI Chat (Arki)

App de chat com IA na porta 3003. Serve como exemplo completo de produto
construído sobre o kit: usa `@workspace/ai` (conversas, mensagens, créditos),
`@workspace/auth` (sessão), `@workspace/database` (leitura server-first),
`@workspace/rate-limit`, `@workspace/ui` e `@workspace/analytics`.

## Subir em cinco passos

```bash
# 1. dependências, na raiz do monorepo
bun install

# 2. banco
docker compose up -d
bun --cwd packages/database run migrate

# 3. env
cp apps/ai-chat/.env.example apps/ai-chat/.env
cp apps/dashboard/.env.example apps/dashboard/.env
# preencha AUTH_SECRET (o mesmo nos dois) e ao menos uma chave de IA

# 4. confira antes de rodar
bun run tools/env-check/env-doctor.ts

# 5. dashboard (:3000) e chat (:3003)
bun run dev
```

O dashboard precisa estar no ar: é lá que fica o login e as rotas HTTP de
mutação. Crie a conta em `http://localhost:3000` e abra
`http://localhost:3003`.

## Variáveis

| Variável | Obrigatória | Para quê |
|----------|-------------|----------|
| `DATABASE_URL` | Sim | Mesmo banco do dashboard. |
| `AUTH_SECRET` | Sim | Precisa ser **idêntico** ao do dashboard; é o que valida a sessão. |
| `OPENAI_API_KEY` | Uma das duas | Habilita os modelos GPT. |
| `ANTHROPIC_API_KEY` | Uma das duas | Habilita os modelos Claude. |
| `NEXT_PUBLIC_DASHBOARD_URL` | Sim | Para onde mandar quem chega deslogado. |
| `NEXT_PUBLIC_AI_CHAT_URL` | Recomendada | Faz o login devolver o usuário pro chat. Precisa estar no `.env` do **dashboard** também. |
| `AUTH_COOKIE_DOMAIN` | Só em subdomínios | `.seudominio.com` quando dashboard e chat estão em hosts diferentes. |
| `RATE_LIMIT_REDIS_URL` | Só em produção | Sem ela o limite de uso conta por processo. |
| `AI_CHAT_FREE_MESSAGES` | Não | Cota gratuita por usuário (padrão 20). |
| `AI_CHAT_MAX_CONTEXT_MESSAGES` / `_CHARS` | Não | Quanto do histórico vai pro modelo (padrão 20 / 24000). |
| `AI_CHAT_MAX_OUTPUT_TOKENS` | Não | Teto por resposta (padrão 2048). |
| `AI_CHAT_SYSTEM_PROMPT` | Não | Troca o tom e o idioma do assistente. |
| `NEXT_PUBLIC_THEME_MODE` | Não | `light` ou `dark`. |

O seletor de modelo mostra só o que as chaves configuradas permitem. Com um
provider só, o seletor some.

## Como funciona

**Login** não existe aqui: a sessão é a do dashboard, por design. Quem chega
deslogado é mandado pro login de lá com `callbackUrl` e volta pra conversa onde
estava.

**Leitura** é server-first: as páginas leem o banco direto pelo `@workspace/ai`.
**Mutação** de conversa passa pelas rotas do dashboard
(`apps/dashboard/app/api/ai-chat/`).

**A geração** vive em `app/api/chat/route.ts`, que é dono do ciclo: limite de
uso, cobrança do crédito, gravação da pergunta, streaming e gravação da
resposta. Gravar no servidor é o que faz a resposta sobreviver quando o usuário
para no meio, fecha a aba ou perde a rede. Se a geração falhar, o crédito é
estornado.

## Modo demonstração

O app é um exemplo aberto: em vez de cada visitante criar conta, todos entram
com a mesma credencial de demonstração, criada pelo seed.

```bash
bun --cwd packages/database run seed-demo
# demo@arki.dev / Demo1234 (mude com DEMO_EMAIL e DEMO_PASSWORD)
```

Como a conta é compartilhada, a cota por usuário não limitaria nada. Quem
separa um visitante do outro é o **IP**, com cota **vitalícia**: 3 mensagens e
3 envios de documento (`AI_CHAT_DEMO_MESSAGES`, `AI_CHAT_DEMO_UPLOADS`).
Esgotada, a resposta é 402 com `code: DEMO_LIMIT` e a UI abre o dialog de
compra de pacotes.

O contador vive em `ai_demo_quota` (`packages/ai/src/demo-quota.ts`): é um
upsert condicional, então requisições simultâneas do mesmo IP não furam o
teto, e operação que falha devolve a cota. Quem está em
`AI_CHAT_KB_ADMIN_EMAILS` não gasta cota e é o único que apaga documentos da
base — é a conta que prepara o conteúdo da demonstração.

Os headers de IP (`cf-connecting-ip`, `x-real-ip`, `x-forwarded-for`) são
falsificáveis por quem fala direto com o servidor: servem para dosar uma
demonstração, nunca para autorização.

## Créditos

Cada usuário ganha uma cota gratuita (padrão 20 mensagens) e depois compra
pacotes por PIX ou cartão via AbacatePay: 10 por R$ 5, 50 por R$ 15, 100 por
R$ 40 (edite em `packages/ai/src/credit-packs.ts`). O saldo aparece no header e
o extrato dentro do dialog de compra.

Para o fluxo de compra funcionar, configure no **dashboard**:

- `BILLING_ABACATEPAY_SECRET_KEY`
- `BILLING_ABACATEPAY_WEBHOOK_SECRET`

O webhook credita de forma idempotente: reenvio do provedor não credita duas
vezes. Sem essas chaves o chat funciona normalmente até a cota gratuita acabar;
o checkout responde 501.

## Trocar de provider de IA

1. `bun add @ai-sdk/<provider> --cwd apps/ai-chat`
2. adicione a entrada em `CHAT_PROVIDERS` (`lib/models.ts`) e a fábrica em
   `lib/providers.ts`
3. liste os modelos em `CHAT_MODEL_IDS` e `CHAT_MODEL_DEFINITIONS`

## Comandos

```bash
bun --cwd apps/ai-chat run dev
bun --cwd apps/ai-chat run test
bun run build --filter=@workspace/ai-chat
```

Testes que dependem de banco real (saldo, estorno, concorrência) rodam com
`RUN_AI_INTEGRATION_TESTS=1 bun run test`.
