# Prompt — Mapa de Cultura (protótipo IEL)

> **Situação:** implementado em 2026-09-19. A descrição da tela em funcionamento está em
> [`docs/telas/15-mapa-de-cultura.md`](telas/15-mapa-de-cultura.md); este arquivo fica como registro
> da especificação original.

Prompt de execução para a feature **Mapa de Cultura** dentro do protótipo `/iel`.
Complementa `docs/BRIEFING_CLAUDE_PROTOTIPO_IEL.md` e obedece `app/docs/boas-praticas-de-codigo.md`,
`app/docs/padroes-de-git.md`, `app/docs/testing.md` e `app/docs/repo-definition-of-done.md`.

---

Você é um engenheiro implementando o **Mapa de Cultura** no protótipo IEL deste monorepo.

Antes de escrever qualquer linha, leia nesta ordem:

1. `app/apps/dashboard/features/iel-demo/analysis/fit-axes.ts`
2. `app/apps/dashboard/features/iel-demo/analysis/culture.ts`
3. `app/apps/dashboard/features/iel-demo/state/selectors.ts` (a partir de `getCultureReading`)
4. `app/apps/dashboard/features/iel-demo/types.ts`
5. `app/docs/boas-praticas-de-codigo.md`

Trabalhe **apenas dentro do protótipo** (`app/(iel)/`, `components/iel-demo/`, `features/iel-demo/`).
O boilerplate Arki fica intacto: nada de alterar `packages/ui`, `packages/charts`, `packages/database`,
`packages/auth` ou qualquer app fora do dashboard. A única exceção permitida é acrescentar uma entrada
de rota em `packages/routes/src/index.ts`, onde as rotas `/iel` já vivem.

---

## 1. O que a feature entrega

Um **Mapa de Cultura**: um plano de duas dimensões onde talento e empresa são posicionados nos mesmos
termos, para mostrar encaixe de **ambiente de trabalho** — nunca competência técnica, nunca traço de
pessoa.

Três entregas:

- **Bloco no resultado talento × vaga** — mapa com o ponto da pessoa e o ponto da empresa, o nível de
  encaixe e a leitura em texto, ao lado da leitura por eixo que já existe.
- **Aba panorama** — nova rota `/iel/mapa-de-cultura` com vários talentos e várias empresas no mesmo
  plano, filtro (só talentos / só empresas / ambos), lista lateral com a cultura predominante de cada
  um e destaque do ponto ao selecionar um nome.
- **Base fictícia** — talentos e empresas com culturas variadas o bastante para o mapa mostrar
  dispersão real, não uma nuvem no centro.

---

## 2. Decisão de modelo — leia antes de codar

O prompt de origem descreve quatro tipos de cultura: **Colaborativa, Inovadora, Resultados,
Estruturada**. O protótipo já tem um modelo cultural implementado e defendido no código: cinco eixos
de **condição de trabalho observável** (`apoio-inicial`, `autonomia`, `comunicacao-prioridades`,
`ritmo-turno`, `aprendizado`), com questionário em `CULTURE_QUESTIONS`, respostas por papel
(gestão / RH / equipe) e leitura de divergência em `getCultureReading`.

**Não crie um segundo modelo cultural paralelo.** Dois vocabulários de cultura na mesma tela
quebram a leitura e obrigam a empresa a responder duas vezes — exatamente o custo que o enunciado
manda remover. Os quatro tipos entram como **regiões de leitura do mapa**, derivadas de forma
determinística das respostas que já existem nos cinco eixos.

Os quatro nomes descrevem **ambiente de trabalho**, e a tela precisa dizer isso: "Colaborativa" é
uma descrição de como o trabalho acontece, não um rótulo sobre quem a pessoa é. Em nenhum lugar da
interface o tipo pode aparecer como perfil, personalidade ou característica pessoal.

### Os dois eixos do plano

| Eixo        | −1                                      | +1                                           |
| ----------- | --------------------------------------- | -------------------------------------------- |
| `x` (foco)  | pessoas — apoio, convívio, formação     | entrega — meta, resultado, autonomia cobrada |
| `y` (ritmo) | estrutura — processo, rotina previsível | flexibilidade — variação, decisão no momento |

Quadrantes:

- `x < 0`, `y > 0` → **Colaborativa**
- `x > 0`, `y > 0` → **Inovadora**
- `x > 0`, `y < 0` → **Resultados**
- `x < 0`, `y < 0` → **Estruturada**
- `|x| < 0.2` e `|y| < 0.2` → **sem predominância** (rótulo próprio; não force um quadrante)

### Contribuição de cada alternativa

Tabela declarada, fixa, em um módulo só. É ela que torna o cálculo auditável — sem ela o mapa vira
caixa-preta, que o enunciado veda.

| Eixo                      | Alternativa             |     x |     y |
| ------------------------- | ----------------------- | ----: | ----: |
| `apoio-inicial`           | `acompanhamento-formal` | −1.00 | −0.50 |
| `apoio-inicial`           | `troca-informal`        | −0.50 | +0.50 |
| `apoio-inicial`           | `por-conta`             | +0.50 | +0.50 |
| `autonomia`               | `rotina-definida`       |  0.00 | −1.00 |
| `autonomia`               | `parcial`               |  0.00 |  0.00 |
| `autonomia`               | `autonomia-ampla`       | +0.25 | +1.00 |
| `comunicacao-prioridades` | `por-escrito`           | −0.25 | −1.00 |
| `comunicacao-prioridades` | `verbal-inicio`         | −0.25 |  0.00 |
| `comunicacao-prioridades` | `ao-longo-do-dia`       | +0.50 | +0.75 |
| `ritmo-turno`             | `fixo`                  | −0.25 | −1.00 |
| `ritmo-turno`             | `variacao-prevista`     |  0.00 |  0.00 |
| `ritmo-turno`             | `variacao-frequente`    | +0.75 | +0.75 |
| `aprendizado`             | `rotina-propria`        | −0.25 | −0.75 |
| `aprendizado`             | `processos-amplos`      | −0.75 | +0.50 |
| `aprendizado`             | `ja-domina`             | +1.00 |  0.00 |

Posição = **média** dos vetores dos eixos respondidos. Eixo sem resposta não entra na média e não
vale zero — zero é o centro do mapa, e "não respondeu" não é "fica no meio". Guarde quantos eixos
sustentam a posição e mostre isso na tela.

### Encaixe

Distância euclidiana entre os dois pontos, em faixas nomeadas:

| Distância | Rótulo           |
| --------- | ---------------- |
| ≤ 0.50    | Muito próximo    |
| ≤ 1.00    | Próximo          |
| ≤ 1.60    | Alguma distância |
| > 1.60    | Distante         |

**Nada de nota, porcentagem ou ranking.** Este produto não tem nota global, e o mapa não vai ser a
primeira. A faixa vem acompanhada de texto curto que nomeia onde os dois convergem e onde vale
alinhar expectativa, e o texto sai dos eixos concretos, não da distância: `ambos preferem prioridade
por escrito`, `a empresa varia o turno conforme a demanda e a pessoa declarou horário firme — vale
alinhar`.

### Divergência gestão × equipe no mapa

`getCultureReading` já marca eixos onde a gestão e a equipe descrevem práticas diferentes. O mapa
não pode apagar isso escolhendo um lado.

Quando a empresa tiver ao menos um eixo `divergente`, desenhe **dois pontos**: o ponto principal e um
ponto secundário, visualmente mais leve, com a versão da equipe, ligados por uma linha tracejada. A
legenda diz o que a distância entre eles significa. Em empresa sem divergência, um ponto só. Respeite
`MIN_TEAM_RESPONSES` — consulta insuficiente não vira ponto da equipe, vira aviso.

---

## 3. Arquivos a criar e alterar

Nomes novos em **português**, sem acento e sem cedilha, `kebab-case` no arquivo, conforme
`app/docs/boas-praticas-de-codigo.md` §3. Ao editar arquivo existente cujo padrão local é inglês
(`selectors.ts`, `packages/routes`), siga o padrão do arquivo — não misture dois estilos no mesmo
módulo. Não renomeie os vizinhos antigos neste PR.

### Domínio

- **`features/iel-demo/analysis/mapa-cultural.ts`** (novo)
  - `EIXOS_DO_MAPA`, `CONTRIBUICAO_POR_ALTERNATIVA`, `FAIXAS_DE_ENCAIXE`, `TIPOS_DE_CULTURA`
  - `calcularPosicaoCultural(respostas): PosicaoCultural | null`
  - `classificarCultura(posicao): TipoDeCultura | 'sem-predominancia'`
  - `calcularEncaixeCultural(posicaoDoTalento, posicaoDaEmpresa): EncaixeCultural`
  - Puro, determinístico, sem React, sem acesso a estado. É onde mora toda a regra.
  - Comentário de cabeçalho no padrão dos vizinhos: explique **por quê** o modelo deriva dos eixos
    existentes e por que não há nota. Nada de comentário que narra a linha seguinte.

- **`features/iel-demo/analysis/mapa-cultural.test.ts`** (novo) — mesma pasta, padrão dos testes
  vizinhos. Cobre: posição de quem respondeu tudo; posição de quem respondeu parte (eixo faltante não
  vira zero); `null` quando não há resposta nenhuma; cada quadrante; a zona sem predominância; as
  quatro faixas de encaixe nas bordas exatas; simetria da distância.

- **`features/iel-demo/types.ts`** (alterar) — acrescente `PosicaoCultural`, `TipoDeCultura`,
  `EncaixeCultural` e `RespostaCulturalDeTalento`. Este último espelha `CultureAnswer` do lado da
  pessoa: `talentId`, `axisId`, `optionId`, `origin`, `sourceId`, `updatedAt` — sem `count` e sem
  `respondent`, porque a pessoa responde por si.

- **`features/iel-demo/fixtures/preferencias-culturais.ts`** (novo) — respostas culturais dos
  talentos da base demo, exportadas em `fixtures/index.ts`. Hoje `Talent.preferences` guarda texto
  livre; o mapa precisa de `optionId`. Mantenha os dois: o texto continua na tela do talento, a
  resposta estruturada alimenta o mapa, e cada uma aponta a mesma origem.

- **`features/iel-demo/fixtures/culture.ts`** e **`companies.ts`** (alterar) — amplie a base para
  pelo menos **6 empresas** e **8 talentos** com respostas que produzam pontos nos quatro quadrantes
  e ao menos um caso sem predominância. Uma nuvem no centro não demonstra nada. Preserve os casos já
  desenhados: divergência gestão × equipe na Cerrado Distribuição, consulta insuficiente na Oficina
  Pantanal.

- **`features/iel-demo/state/selectors.ts`** (alterar) — exponha `getCultureMapPoints(state, filtro)`
  e `getCultureFitForApplication(state, applicationId)`. Padrão `get*` do arquivo. Seletor lê e
  compõe; a regra fica no módulo de análise.

### Interface

Nenhuma dependência nova de gráfico. `packages/charts` não tem scatter e é boilerplate — não toque
nele. Desenhe o plano em **SVG inline** dentro de `components/iel-demo/`, com as cores via
`hsl(var(--chart-N))` e `var(--border)`, como faz `fit-radar.tsx`.

- **`components/iel-demo/mapa-cultural/plano-cultural.tsx`** (novo) — o SVG: eixos rotulados nas
  quatro pontas, nome do quadrante em marca-d'água, pontos, ponto secundário da equipe quando houver
  divergência, `<title>` por ponto. `'use client'` só aqui e no que precisa de interação.
- **`components/iel-demo/mapa-cultural/encaixe-cultural.tsx`** (novo) — faixa de encaixe + leitura em
  texto para talento × vaga.
- **`components/iel-demo/mapa-cultural/panorama-cultural.tsx`** (novo) — tela da aba: filtro, plano e
  lista lateral com destaque bidirecional (clicar no nome destaca o ponto; focar o ponto destaca o
  nome).
- **`components/iel-demo/talents/fit-reading.tsx`** (alterar) — insira `<EncaixeCultural />` no grid
  que hoje tem `<FitRadar />` + `<FitInsights />`, sem empurrar a lista de eixos para fora da
  primeira dobra.
- **`app/(iel)/iel/mapa-de-cultura/page.tsx`** (novo) — Server Component fino; a interação vive no
  componente cliente. Siga `app/(iel)/iel/talentos/page.tsx`.
- **`packages/routes/src/index.ts`** (alterar) — `cultureMap: resolve('/iel/mapa-de-cultura')` dentro
  de `dashboard.iel`. Chave em inglês porque é o padrão do arquivo; a URL em português porque é
  texto de usuário. Nenhuma tela escreve o caminho na mão.
- **`components/iel-demo/layout/iel-shell.tsx`** (alterar) — item de navegação para o analista do IEL,
  depois de "Empresas". Ícone existente de `@hugeicons/core-free-icons`: confirme o nome exportado
  antes de usar, não invente.

### Estado

O mapa é leitura sobre dados que já existem. Não crie ação nova de reducer para exibi-lo. O filtro e
o item destacado são estado de tela (`useState`), não estado de domínio.

---

## 4. Conformidade — requisito, não enfeite

- **Ambiente de trabalho, nunca pessoa.** Nenhum texto de interface pode ler como personalidade,
  perfil psicológico, saúde ou dado sensível. Rótulo é sobre o trabalho: "ambiente mais estruturado",
  não "pessoa mais estruturada".
- **Determinístico e explicável.** A posição sai da tabela de contribuição, a faixa sai da distância,
  o texto sai dos eixos. A tela mostra quantos eixos sustentam cada ponto e permite chegar às
  respostas que o formaram.
- **Complementar à decisão humana.** O mapa não elimina, não ordena por encaixe, não recomenda
  descarte. Diga isso na tela onde o mapa aparece.
- **Equipe agregada e anônima.** `MIN_TEAM_RESPONSES` continua valendo; nenhum ponto identifica quem
  respondeu.
- **Dados fictícios.** Banner de demonstração já existente continua visível. Nada sai da máquina.

Consulte `privacy-by-design-lgpd.skill` na raiz antes de escrever texto de interface.

---

## 5. IA — só como apoio de preenchimento

O encaixe é calculado por regra, nunca por modelo. Se implementar o diferencial de rascunho:

- Reaproveite `features/iel-demo/ai/` e `app/api/iel/assistant/route.ts`. Não crie provider novo, não
  acrescente dependência, mantenha o `deterministic-provider` como fallback.
- A sugestão segue o padrão de `CultureSuggestion`: proposta + trecho de origem + rótulo da fonte,
  **pendente** até alguém confirmar. Sugestão nunca entra no mapa sozinha.
- Sem chave configurada, a tela funciona igual. Esta é a regra do protótipo, não uma degradação.

---

## 6. Glossário

`app/docs/boas-praticas-de-codigo.md` §3 manda e vale também no texto de tela:

- `talento` — não `candidato`, não `pessoa` no identificador
- `empresa` — não `cliente`, não `organizacao`
- `vaga` — não `posicao`, não `oportunidade`
- `fit` — não `match`, **não `aderencia`**
- `cultura` — o eixo do modelo é `eixo`, não `dimensao` (`Dimension` já significa outra coisa aqui)

---

## 7. Definition of Done

Rode no escopo afetado (`app/docs/repo-definition-of-done.md`):

```bash
bun run lint
bun run typecheck
bun run test
bun --filter @workspace/dashboard test:e2e
```

Além disso:

- `mapa-cultural.test.ts` passando, com os casos da seção 3.
- `e2e/iel-demo/iel-demo-journey.spec.ts` estendido: abrir `/iel/mapa-de-cultura`, alternar o filtro,
  selecionar um nome e ver o ponto destacado.
- Sem `any`, sem `'use client'` em página, sem caminho escrito na mão, sem import por subpath de
  `@workspace/ui`.
- Nenhum arquivo do boilerplate alterado além da entrada em `packages/routes`.

## 8. Git

`app/docs/padroes-de-git.md`:

- Branch: `feat/mapa-de-cultura`
- Commits em Conventional Commits, escopo `iel`, descrição em português no imperativo:

```text
feat(iel): adiciona mapa de cultura ao resultado talento x vaga
feat(iel): adiciona aba panorama do mapa de cultura
test(iel): cobre calculo de posicao e encaixe cultural
```

## 9. Relatório final

Ao terminar, reporte: arquivos criados e alterados; como o mapa deriva dos cinco eixos; quais casos
a base demo passou a cobrir; resultado de cada comando do DoD; e o que ficou de fora com o motivo.
