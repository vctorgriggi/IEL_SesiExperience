# Comparação entre candidatos

**Rota:** `/vagas/[jobId]/comparar`
**Componente:** `apps/dashboard/components/iel-demo/selection/comparison-screen.tsx`
**Persona:** Analista IEL
**Última atualização:** 2026-09-19

## O que a tela faz

Põe lado a lado as candidaturas marcadas na mesa de seleção, nos mesmos critérios da vaga, para que
a decisão seja tomada sobre o mesmo conjunto de perguntas — e não sobre a impressão deixada por cada
currículo.

## O que aparece

- **Grade de comparação** — a pergunta é por linha ("em que ponto elas diferem?"), então a comparação
  é por coluna: uma pessoa por coluna, um critério por linha. Uma lista por pessoa obrigaria a guardar
  o valor de uma na cabeça para comparar com o da outra.
- **Aderência de cada pessoa** à cultura da empresa, na mesma leitura da mesa de seleção, para que a
  comparação não fique só no técnico.
- **Leitura assistida** — o que difere entre os selecionados e o que ainda falta saber.
- **Ações a partir da comparação** — adicionar à lista de encaminhamento ou abrir um esclarecimento
  dirigido ao critério que ficou em aberto.

## De onde vêm os dados hoje

`compareSelection`, em `features/iel-demo/analysis/assistant.ts`, sobre a seleção guardada em
`state.comparison[jobId]`.

## Ações do usuário

- Adicionar à lista de encaminhamento — `add-to-referral-list`.
- Abrir pedido de esclarecimento a partir de um critério.

## Backend futuro

- A comparação continua sendo cálculo determinístico sobre a análise; o que muda é a origem dos
  estados e o registro de quem comparou o quê e quando.
- Exportar a comparação (PDF ou planilha) vira operação de servidor, com o mesmo recorte de
  visibilidade do encaminhamento.

## Regras e limites

- Sem nota, sem ranking e sem ordenação por "melhor candidato". A tela mostra diferença de
  informação; a decisão é de quem lê.
- No máximo `COMPARISON_LIMIT` candidaturas por comparação: comparar dezenas ao mesmo tempo é o
  mesmo que não comparar.

## Ligações

Vem de: [Mesa de seleção](04-mesa-de-selecao.md).
Entra em: [Preparação do encaminhamento](06-preparacao-do-encaminhamento.md),
[Pendências](11-pendencias.md).

## Histórico

- 2026-09-19 — criada.
- 2026-09-19 — a grade passou a trazer a aderência junto dos critérios, e o texto de cabeçalho saiu
  da tela na interface Mind RH.
