# Mesa de seleção

**Rota:** `/vagas/[jobId]`
**Componentes:** `apps/dashboard/components/iel-demo/selection/job-screen.tsx`,
`selection/candidates-table.tsx`, `selection/job-section-cards.tsx`,
`selection/candidate-state-badge.tsx`, `selection/axis-weights.tsx`
**Regra:** `apps/dashboard/features/iel-demo/analysis/adherence.ts`
**Persona:** Analista IEL
**Última atualização:** 2026-09-19

## O que a tela faz

É o centro do produto e responde uma pergunta operacional: **quem enviar para esta empresa**.

A tela não explica o método em parágrafo nenhum. Cada explicação escrita no meio dela empurrava a
lista para baixo da dobra, então o que era texto virou `Tooltip` de 14px; o que era herói com três
números virou quatro cartões de pendência; e o que era ranking com disclosure virou uma tabela com
quatro leituras e paginação.

Atende **M5**.

## O que aparece

- **Cabeçalho** com a vaga, a empresa e o caminho publicado na casca.
- **Quatro cartões de pendência** (`job-section-cards.tsx`): o que falta para a vaga andar —
  cobertura do perfil cultural da empresa, candidatos sem questionário, pedidos em aberto e a lista
  de encaminhamento.
- **Tabela de candidatos** (`candidates-table.tsx`), com quatro leituras da mesma lista:
  - **Sugeridos** — a aba que abre, com as cinco primeiras linhas.
  - **Todos** — a lista inteira, paginada.
  - **Resgate** — quem o filtro técnico deixaria de fora mas a aderência recomenda olhar. É a
    resposta ao problema que o cliente relatou: filtro configurado errado expurga candidato aderente
    sem ninguém ver.
  - **Sem resposta** — quem ainda não respondeu o questionário. Ausência é estado, não nota zero.
- **Colunas**: quanto combina (aderência), requisitos (match técnico vindo da planilha) e estado.
  Quem não tem medida vai para o fim da ordenação, seja qual for a direção escolhida.
- **Prioridade por eixo** (`axis-weights.tsx`) — o peso que a empresa declarou para cada eixo nesta
  vaga, com a proposta da análise pendente de confirmação humana.
- **Detalhe da pessoa**, aberto na própria tela.

## De onde vêm os dados hoje

- `getJobRanking`, `getRescueCandidates`, `getApplicationsByJob`, `getReferralListSelection`,
  `getComparisonSelection`, `getClarificationsByJob`, `getCompanyCultureProfile`,
  `getCultureSampleProgress` e `getRecentHistory`, em `state/selectors.ts`.
- O percentual vem de `analysis/adherence.ts`, via `getAdherence`.

## Ações do usuário

- Mapa da empresa — abre o [Mapa de Cultura](15-mapa-de-cultura.md) da empresa desta vaga, com o
  escopo já nos inscritos dela. Era "Ver aderência" e levava a uma tela que repetia este ranking com
  outra roupa; a aderência por vaga é o que esta mesa já mostra, e o que faltava era o passo de trás
  — a cultura da empresa e quem na base combina com ela. Leitura, sem ação de reducer.
- Marcar candidatura para comparação — `toggle-comparison` (limite `COMPARISON_LIMIT`).
- Adicionar à lista de encaminhamento — `add-to-referral-list` (limite `REFERRAL_LIMIT`, cinco).
- Remover da lista — `remove-from-referral-list`.
- Confirmar prioridade de eixo — `set-axis-weight`.
- Abrir pedido de esclarecimento — diálogo em `clarifications/create-clarification-dialog.tsx`.

## Backend futuro

- O estado por critério deixa de ser fixture e passa a ser tabela de análise por candidatura, com
  autoria e data de cada mudança.
- A leitura assistida vira chamada de servidor com registro do prompt, da versão do modelo e da
  resposta — auditoria é exigência, não conveniência.
- Evidências ganham identificação de origem, hash e prazo de retenção; a visibilidade (interna ou
  compartilhável) passa a ser verificada no servidor, não só na tela.

## Regras e limites

- **O corte de 35% marca, não elimina.** Quem fica abaixo continua na tabela, marcado, e o analista
  decide. O enunciado veda corte automático.
- **A aba de resgate existe para desfazer injustiça de filtro**, não para contornar requisito.
- **A sugestão da análise nunca vira resposta sozinha**: fica pendente até alguém confirmar.
- **Ausência não é zero.** Sem resposta de um dos lados o eixo não entra na conta, e o denominador
  aparece na tela.
- **Evidência marcada como interna não vaza** para o encaminhamento.

## Ligações

Entra em: [Comparação](05-comparacao.md), [Perfil do talento](08-perfil-do-talento.md),
[Preparação do encaminhamento](06-preparacao-do-encaminhamento.md), [Pendências](11-pendencias.md),
[Importação de planilha](19-importacao-de-planilha.md).

## Histórico

- 2026-09-19 — criada.
- 2026-09-19 — reescrita para a interface Mind RH: `selection-desk.tsx` deu lugar a `job-screen.tsx`,
  com tabela de quatro leituras, cartões de pendência e aba de resgate. A matriz por critério, o
  painel de evidência e a leitura assistida em painel saíram da tela.
- 2026-09-19 — o cabeçalho ganhou "Ver aderência", que leva à análise de aderência já nesta vaga.
