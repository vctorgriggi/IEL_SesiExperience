Prompt pra aplicar a marca do seu SaaS no repositório, ele executa e faz tudo automaticamente — busca, substitui, cria os arquivos faltantes:

---

Você é um engenheiro executando o rebrand do produto neste monorepo SaaS starter kit.
O produto base se chama "Arki". Você vai substituir as referências de marca do PRODUTO
pelo novo nome — mantendo intacta toda a documentação do starter kit (README, CLAUDE.md,
AGENTS.md, tools/, arki-lp/docs).

Antes de começar, me pergunte:
1. Qual o nome da nova marca? (ex: "Vanta")
2. Qual o domínio? (ex: "usevanta.com")
3. Qual o nome do banco de dados? (ex: "vanta_events" — ou posso sugerir baseado no nome)
4. Qual o usuário do banco? (ex: "vanta_user" — ou posso sugerir)

Após confirmar, execute todos os passos abaixo de forma autônoma e reporte ao final.

---

## NÃO TOCAR — fora do escopo
- README.md
- CLAUDE.md
- AGENTS.md
- .windsurfrules
- tools/ (qualquer arquivo)
- arki-lp/docs (qualquer arquivo)
- Qualquer arquivo com "starter kit", "template" ou documentação técnica do projeto

---

## PASSO 1 — Identidade do produto
packages/common/src/app.ts:
- APP_NAME: 'Arki' → '<NOVA_MARCA>'
- APP_DESCRIPTION: substituir menção a Arki → descrição genérica do produto

package.json (raiz):
- name: "arki" → "<nova-marca-lowercase>"

---

## PASSO 2 — Variáveis de ambiente
Em TODOS os arquivos .env.example:
- arki_events → <nova_marca>_events
- arki_user → <nova_marca>_user
- arki_password → <nova_marca>_password
- arki.com / usearki.dev → <dominio>
- Atualizar DATABASE_URL para refletir novas credenciais

---

## PASSO 3 — Docker
Em docker-compose.yml, docker-compose.dev.yml, docker-compose.prod.yml:
- POSTGRES_DB, POSTGRES_USER, POSTGRES_PASSWORD → novas credenciais
- networks: arki-network → <nova-marca>-network
- DATABASE_URL inline → nova URL

---

## PASSO 4 — Código fonte dos apps
- apps/ai-chat/app/(protected)/chat/[id]/page.tsx
  BASE_TITLE: 'Chat com IA – Arki' → 'Chat com IA – <NovaMarca>'

- apps/ai-chat/app/layout.tsx
  description mencionando Arki → nova marca

- apps/dashboard/lib/geocode.ts
  USER_AGENT: 'Arki-Dashboard/1.0' → '<NovaMarca>-Dashboard/1.0'

---

## PASSO 5 — Email templates
Buscar em todo o monorepo por templates de email (.html, .tsx, .ts, .mjml).
Em subjects e bodies:
- "Arki" → "<NovaMarca>"
- URLs usearki.dev → <dominio>

---

## PASSO 6 — SEO / Metadata hardcoded
Buscar por og:title, og:image, twitter:card, <title> tags com "Arki" hardcoded
(ignorar os que já usam APP_NAME dinamicamente).
Substituir pela nova marca.

---

## PASSO 7 — Verificação final
Busca global por "arki" e "usearki" (case-insensitive) em todo o projeto.
Ignorar: node_modules/, .git/, arquivos binários, lockfiles, e os arquivos
listados em "NÃO TOCAR".

Listar tudo que sobrar com arquivo + linha para revisão manual.

---

## RELATÓRIO FINAL
- ✅ Arquivos modificados
- ⚠️ Ocorrências remanescentes para revisão manual (com arquivo e linha)