# Mesa de seleção

**Rota:** `/iel/vagas/[jobId]`
**Componente:** `apps/dashboard/components/iel-demo/selection/selection-desk.tsx`
**Persona:** Analista IEL
**Última atualização:** 2026-09-19

## O que a tela faz

É o centro do produto: reúne, numa vaga só, os critérios que a empresa declarou, todas as
candidaturas e o estado de cada critério por candidatura. É onde o analista decide quem comparar, o
que perguntar e quem entra na lista de encaminhamento.

## O que aparece

- **Cabeçalho** com o título da vaga e o resumo declarado.
- **Matriz de candidaturas** (`selection/candidates-matrix.tsx`) — uma linha por candidatura, uma
  coluna por critério, com o estado de cada cruzamento: alinhamento, a esclarecer, divergência, sem
  informação ou não se aplica. Clicar numa célula abre a evidência que sustenta o estado.
- **Painel de evidência** (`shared/evidence-panel.tsx`) — a informação de origem, a fonte, a data e
  a leitura sobre o alcance dela.
- **Leitura assistida** (`selection/assistant-panel.tsx`) — resumo da seleção, comparação e sugestão
  de pergunta.
- **Requisitos e critérios** — critérios da vaga, com dimensão e obrigatoriedade.
- **Contexto da empresa e da equipe** — condições de trabalho registradas para a equipe da vaga.
- **Prioridade por eixo** (`companies/axis-weights.tsx`) — o peso que a empresa declarou para cada
  eixo nesta vaga, com a proposta da análise pendente de confirmação.
- **Requisitos essenciais informados** e **Histórico da vaga**.

## De onde vêm os dados hoje

Seletores de candidatura, análise por critério, evidência, condições da equipe e pesos por eixo. A
leitura assistida usa `features/iel-demo/ai/` com provider determinístico por padrão; com chave
configurada, passa pelo route handler `app/api/iel/assistant/route.ts`.

## Ações do usuário

- Marcar candidatura para comparação — `toggle-comparison` (limite `COMPARISON_LIMIT`).
- Limpar a comparação — `clear-comparison`.
- Adicionar à lista de encaminhamento — `add-to-referral-list`.
- Abrir pedido de esclarecimento — diálogo em `clarifications/create-clarification-dialog.tsx`.
- Confirmar prioridade de eixo — `set-axis-weight`.

## Backend futuro

- O estado por critério deixa de ser fixture e passa a ser tabela de análise por candidatura, com
  autoria e data de cada mudança.
- A leitura assistida vira chamada de servidor com registro do prompt, da versão do modelo e da
  resposta — auditoria é exigência, não conveniência.
- Evidências ganham identificação de origem, hash e prazo de retenção; a visibilidade (interna ou
  compartilhável) passa a ser verificada no servidor, não só na tela.

## Regras e limites

- A sugestão da análise nunca vira resposta sozinha: fica pendente até alguém confirmar.
- Nenhum candidato é eliminado automaticamente. A matriz mostra estado de informação, não nota.
- Evidência marcada como interna não pode vazar para o encaminhamento.

## Ligações

Entra em: [Comparação](05-comparacao.md), [Perfil do talento](08-perfil-do-talento.md),
[Preparação do encaminhamento](06-preparacao-do-encaminhamento.md),
[Pendências](11-pendencias.md).

## Histórico

- 2026-09-19 — criada.
