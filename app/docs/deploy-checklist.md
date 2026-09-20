# Checklist de deploy (Arki)

Use este checklist antes e depois de fazer o deploy do dashboard (e de qualquer app que exponha a API). Use junto com os docs do repo local e as configurações do seu provedor de hospedagem.

---

## 1. Segredos

- [ ] **Nunca commite segredos.** Use as variáveis de ambiente / secrets do seu provedor (ex: Vercel, Railway) e nunca coloque valores reais em `.env` que sejam commitados.
- [ ] **Segredos obrigatórios** (definir em produção):
  - `AUTH_SECRET` — mínimo **32 caracteres**; usado pelo Better Auth (sessões, cookies, tokens).
  - `DATABASE_URL` — string de conexão PostgreSQL (mesmo banco para o dashboard e código server-only). Prefira `sslmode=require` em produção.
  - **Se usar Stripe:**  
    `BILLING_STRIPE_SECRET_KEY`, `BILLING_STRIPE_WEBHOOK_SECRET` (e os IDs de preço `NEXT_PUBLIC_BILLING_PRICE_*` do catálogo).
  - **Se usar AbacatePay:**  
    `BILLING_ABACATEPAY_SECRET_KEY`, `BILLING_ABACATEPAY_WEBHOOK_SECRET`.
- [ ] Confirme que nenhum `.env` com segredos reais está no repo ou nos artefatos de build.

---

## 2. HTTPS

- [ ] **App e API servidos apenas via HTTPS em produção.** Desative HTTP ou redirecione HTTP → HTTPS na edge (Vercel, load balancer, etc.).
- [ ] **Cookie e auth:** Better Auth e cookies de sessão devem rodar sobre HTTPS em prod para que os cookies não sejam enviados por HTTP simples.

---

## 3. Variáveis de ambiente

- [ ] **Execute `bun run tools/env-check/env-doctor.ts`** a partir da raiz do repo antes do deploy. Corrija qualquer variável ausente ou inválida reportada para os apps que você está fazendo deploy.
- [ ] **`NEXT_PUBLIC_*`** — Defina apenas variáveis que precisam ser expostas ao cliente. Não coloque segredos ou chaves server-only em `NEXT_PUBLIC_*`. Vars públicas típicas:
  - `NEXT_PUBLIC_DASHBOARD_URL`, `NEXT_PUBLIC_MARKETING_URL` (e `NEXT_PUBLIC_API_URL` se a API estiver em outro domínio).
  - `NEXT_PUBLIC_AI_CHAT_URL` se você usa o app de chat: é o que permite o login devolver o usuário pro chat depois de autenticar.
  - Opcional: analytics (ex: `NEXT_PUBLIC_ANALYTICS_*`), tema, token do Mapbox, DSN de monitoramento — apenas se o app precisar deles no browser.
- [ ] **`.env.example` por app** — Use `apps/dashboard/.env.example`, `apps/marketing/.env.example`, etc., como referência para as vars obrigatórias/opcionais. Copie deles para o seu provedor; não commite valores reais.
- [ ] **Apps em subdomínios diferentes** (ex.: `app.seudominio.com` e `chat.seudominio.com`): defina `AUTH_COOKIE_DOMAIN=.seudominio.com` **no env de todos os apps**. Sem isso o cookie de sessão é host-only e o usuário logado no dashboard chega deslogado no chat. Em domínio único, deixe a variável de fora.
- [ ] **CORS e headers de segurança** (opcional): Se a API do dashboard for chamada de outra origem (ex: frontend em domínio diferente), defina `ALLOWED_ORIGINS` com uma lista separada por vírgulas das origens permitidas (ex: `https://app.example.com`). Se não definido, apenas `NEXT_PUBLIC_DASHBOARD_URL` é permitido. Headers de segurança: `SECURITY_X_FRAME_OPTIONS` (`deny` ou `sameorigin`), `SECURITY_REFERRER_POLICY` (ex: `strict-origin-when-cross-origin`). Veja `apps/dashboard/.env.example` para detalhes.

---

## 4. App de chat (demonstração)

- [ ] **Migrações antes de subir o app**: `bun --filter @workspace/database migrate`. O chat exige a extensão `vector` (base de conhecimento); o Postgres precisa suportá-la — a imagem local é `pgvector/pgvector:pg16`, e em serviço gerenciado confira se `CREATE EXTENSION vector` é permitido antes do deploy.
- [ ] **Conta de demonstração**: `bun --filter @workspace/database seed-demo` contra o banco de produção. Defina `DEMO_EMAIL` e `DEMO_PASSWORD` no ambiente do comando — o padrão (`demo@arki.dev` / `Demo1234`) é público e serve só para local.
- [ ] **`OPENAI_API_KEY`** é obrigatória: além dos modelos de chat, os embeddings da base de conhecimento dependem dela. Enquanto ela não estiver configurada, `/chat` responde erro — o app sobe, mas não gera resposta. Configure antes de divulgar a URL.
- [ ] **O chat não precisa do dashboard.** Ele tem login próprio em `/sign-in` e serve as próprias rotas de dados, então `NEXT_PUBLIC_DASHBOARD_URL` não entra no deploy dele. Precisa de `DATABASE_URL` e `AUTH_SECRET`; `AUTH_COOKIE_DOMAIN` só quando você quiser compartilhar sessão com outro app do produto.
- [ ] **`AI_CHAT_KB_ADMIN_EMAILS`**: emails que administram a base de conhecimento. Só eles apagam documentos e não gastam cota de demonstração.
- [ ] **Cota da demonstração** (`AI_CHAT_DEMO_MESSAGES` / `AI_CHAT_DEMO_UPLOADS`, padrão 3 e 3): é contada **por IP**, então o app precisa receber o IP real do visitante. Atrás de CDN/proxy, garanta que `cf-connecting-ip`, `x-real-ip` ou `x-forwarded-for` cheguem à aplicação; sem isso todos os visitantes compartilham a mesma cota.
- [ ] **Rate limit distribuído**: defina `RATE_LIMIT_REDIS_URL`. Sem Redis a contagem é por processo e, com várias instâncias, o teto real vira N vezes o configurado.

---

## 5. Mind RH com Neon (estado da demo compartilhado)

Por padrão o estado da demonstração fica no `localStorage` de cada navegador — e o que o candidato responde no celular não chega ao notebook da analista. Para a demo ao vivo entre aparelhos, o estado passa a morar no servidor:

- [ ] **Criar o projeto no Neon** (Postgres gerenciado, plano gratuito serve). Na página do projeto, copie a **connection string pooled** (a que passa pelo pooler, com `-pooler` no host). Ela já vem com `sslmode=require`; o cliente (`packages/database/src/client.ts`) lê isso e liga o TLS.
- [ ] **Migrar uma vez**, da sua máquina, apontando para o Neon:  
  `DATABASE_URL='<connection string>' bun --filter @workspace/database migrate`  
  (ou `push`, em desenvolvimento). Cria `iel_demo_salas` e `iel_demo_eventos`, além das tabelas do kit. O chat exige a extensão `vector` — no Neon ela é permitida; se a migração reclamar, rode `CREATE EXTENSION vector` no SQL Editor do Neon e repita.
- [ ] **Variáveis na Vercel** (Project → Settings → Environment Variables), para Production e Preview:
  - `DATABASE_URL` = a connection string pooled;
  - `IEL_ESTADO_COMPARTILHADO=1`.  
  Sem as duas juntas, a app continua no modo navegador (não quebra). Depois de salvar, faça um redeploy: variável de ambiente só entra no próximo build.
- [ ] **Mind com modelo real (opcional)**, nas mesmas Environment Variables, só do servidor (nunca `NEXT_PUBLIC_*`):
  - `IEL_AI_PROVIDER=gemini` e `GEMINI_API_KEY` (chave do Google AI Studio); `GEMINI_MODEL` é opcional, padrão `gemini-3.6-flash`.
  - Alternativas com a mesma regra: `IEL_AI_PROVIDER=deepseek` + `DEEPSEEK_API_KEY` (+ `DEEPSEEK_MODEL`), ou `IEL_AI_PROVIDER=anthropic` + `ANTHROPIC_API_KEY`.  
  Sem provedor e chave, o Mind, a devolutiva e as mensagens saem da regra fixa (não quebra). Com chave, o que sai é pseudonimizado (`docs/PRODUTO.md` §5.8) e a transferência internacional precisa do jurídico antes de dado real.
- [ ] **Testar o fluxo entre aparelhos**: abra a Central no notebook, entre numa vaga e copie o link do questionário de um candidato; abra o link no celular (rede diferente serve) e responda. Em até 4 segundos a resposta aparece no notebook — a tela sonda `GET /api/iel/estado` enquanto está visível. `curl 'https://<seu-domínio>/api/iel/estado?sala=principal'` deve responder `{ revisao, schemaVersion, persisted }`; se responder `{ "erro": "estado compartilhado desligado" }` (503), falta uma das duas variáveis.
- [ ] **Reiniciar a demo** antes de apresentar: menu da analista → "Reiniciar demonstração" (faz `DELETE /api/iel/acoes` e volta a sala à base fictícia, em todos os aparelhos).
- [ ] **O que é e o que não é**: é um estado de demonstração sobre base fictícia, numa sala única (`principal`). A API da demo não autentica — quem tem o link age (R9/R10) — e o log `iel_demo_eventos` cresce a cada ação sem poda. Em produção, sessão por pessoa e retenção definida (`docs/PRODUTO.md` §5).

---

## Referência rápida

| Item                  | Ação |
|-----------------------|------|
| Segredos              | Apenas no env do provedor; AUTH_SECRET (≥32 chars), DATABASE_URL, chaves de billing se usadas. |
| HTTPS                 | Obrigatório em produção para o app e a API. |
| Validação de env      | `bun run tools/env-check/env-doctor.ts` antes do deploy. |
| Vars públicas de env  | Apenas `NEXT_PUBLIC_*` que o cliente realmente precisa. |
| CORS / segurança      | Opcional: ALLOWED_ORIGINS, SECURITY_X_FRAME_OPTIONS, SECURITY_REFERRER_POLICY (ver .env.example). |
| Mind RH entre aparelhos | `DATABASE_URL` (Neon, pooled) + `IEL_ESTADO_COMPARTILHADO=1` + `migrate` uma vez. |

Depois de fazer tudo do checklist, continue com seu fluxo normal de deploy (por exemplo, Vercel para o dashboard e Postgres gerenciado ou o `docker-compose.yml` local apenas para desenvolvimento).