# Contexto da empresa

**Rota:** `/iel/empresas/[companyId]`
**Componente:** `CompanyDetailScreen`, em
`apps/dashboard/components/iel-demo/companies/companies-screens.tsx`, com
`companies/culture-profile.tsx`
**Persona:** Analista IEL e gestor da própria empresa
**Última atualização:** 2026-09-19

## O que a tela faz

Mostra como o trabalho acontece naquela empresa: as condições declaradas por equipe e o traçado
cultural respondido por gestão, RH e equipe. É onde a divergência entre o que a gestão descreve e o
que a equipe relata fica registrada em vez de ser resolvida no muque.

## O que aparece

- **Cabeçalho** com a descrição institucional declarada pela empresa.
- **Equipes e condições** — condição por condição, com estado (confirmado, da descrição, a
  confirmar) e origem.
- **Traçado cultural** (`companies/culture-profile.tsx`) — um bloco por eixo, com:
  - as vozes que responderam (gestão, RH, equipe) e a alternativa mais respondida em cada uma;
  - o estado do eixo: convergente, divergente, só a gestão respondeu, consulta à equipe sem base
    suficiente, ninguém respondeu;
  - a **proposta da análise** quando existe: alternativa sugerida a partir de texto que a empresa já
    escreveu, com o trecho de origem, pendente até alguém confirmar ou corrigir.
- **Vagas associadas.**

## De onde vêm os dados hoje

`getCultureReading`, `getCultureAttentionPoints`, `getTeamsByCompany`, `getJobsByCompany`, sobre
`state.cultureAnswers` e `company.cultureSuggestions`.

## Ações do usuário

- Responder ou corrigir um eixo do traçado — `answer-culture`.
- Abrir pedido de esclarecimento sobre uma condição.

## Backend futuro

- A consulta à equipe vira coleta real: link anônimo, uma resposta por pessoa, agregação no
  servidor, resultado só liberado acima do mínimo de respostas (`MIN_TEAM_RESPONSES`).
- A proposta da análise passa a ser gerada no servidor a partir dos textos da empresa, com o trecho
  de origem guardado junto — sem isso a confirmação vira clique no escuro.
- Versionamento do traçado: cultura muda, e a leitura de um encaminhamento antigo precisa continuar
  correspondendo ao que valia na época.

## Regras e limites

- Resposta da equipe é **agregada e anônima**. Quem responde sobre o próprio ambiente de trabalho
  não pode ficar identificado para a gestão.
- Abaixo de `MIN_TEAM_RESPONSES`, a tela diz que a consulta não tem base suficiente em vez de tratar
  duas respostas como "a equipe".
- Divergência entre gestão e equipe é informação, não erro a corrigir escolhendo um lado.
- Os eixos descrevem prática de trabalho, nunca traço de pessoa.

## Ligações

Vem de: [Empresas](09-empresas.md), [Painel da empresa](02-painel-da-empresa.md).
Alimenta: [Mapa de Cultura](15-mapa-de-cultura.md), [Perfil do talento](08-perfil-do-talento.md),
[Mesa de seleção](04-mesa-de-selecao.md).

## Histórico

- 2026-09-19 — criada.
