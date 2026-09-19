# Perfil do talento

**Rota:** `/iel/talentos/[talentId]` — com `?vaga=<jobId>` para ler o perfil no contexto de uma vaga
**Componente:** `apps/dashboard/components/iel-demo/talents/talent-profile-screen.tsx`
**Persona:** Analista IEL
**Última atualização:** 2026-09-19

## O que a tela faz

Reúne tudo que a base sabe sobre uma pessoa e, quando há vaga no contexto, a leitura dessa pessoa
naquela vaga. Sem vaga, a tela diz explicitamente que compatibilidade depende da oportunidade e não
mostra análise por critério.

## O que aparece

Com vaga no contexto:

- **Análise por critério** — o estado de cada critério da vaga, com a evidência que o sustenta.
- **Aderência ao contexto de trabalho** (`talents/fit-reading.tsx`) — os cinco eixos, lado a lado:
  o que a equipe informou e o que a pessoa declarou, com radar de leitura × prioridade
  (`fit-radar.tsx`) e a leitura em texto (`fit-insights.tsx`).
- **Mapa de Cultura** (`mapa-cultural/encaixe-cultural.tsx`) — a posição da pessoa e a da empresa no
  mesmo plano, a faixa de encaixe e o que convergir ou alinhar. Ver
  [Mapa de Cultura](15-mapa-de-cultura.md).

Sempre:

- **Experiências declaradas**, **Avaliações existentes** (resultado externo, na escala de origem),
  **Registros e origens** (rastreabilidade do que é compartilhável), **Notas internas do IEL** e a
  **jornada do talento** (`talents/talent-journey.tsx`).

## De onde vêm os dados hoje

`getTalent`, `getFitReading`, `getAxisWeights`, `getCultureReading`, `getCultureFit`,
`getSharedEvidences` e `getAssessments`.

## Ações do usuário

- Adicionar à lista de encaminhamento — `add-to-referral-list`.
- Registrar nota interna — `add-internal-note`.
- Abrir pedido de esclarecimento a partir de um critério.

## Backend futuro

- Perfil consolidado a partir das fontes integradas, com precedência declarada quando duas fontes
  divergirem (hoje a divergência aparece como estado, e é assim que deve continuar).
- Nota interna vira registro com autoria e visibilidade garantida no servidor.
- Avaliações externas continuam preservando a escala de origem; nada é convertido em nota própria.

## Regras e limites

- Os eixos descrevem **condição de trabalho**, nunca traço de personalidade ou dado de saúde.
- Nota interna é interna: não acompanha encaminhamento.
- Toda informação exibida aponta origem, fonte e data.

## Ligações

Vem de: [Talentos](07-talentos.md), [Mesa de seleção](04-mesa-de-selecao.md),
[Comparação](05-comparacao.md).
Entra em: [Preparação do encaminhamento](06-preparacao-do-encaminhamento.md).

## Histórico

- 2026-09-19 — criada, já com o bloco do Mapa de Cultura.
