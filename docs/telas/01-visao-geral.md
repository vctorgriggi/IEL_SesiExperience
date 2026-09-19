# Visão geral

**Rota:** `/iel`
**Componente:** `apps/dashboard/components/iel-demo/overview/overview-screen.tsx`
**Persona:** Analista IEL (o gestor cai em [Painel da empresa](02-painel-da-empresa.md))
**Última atualização:** 2026-09-19

## O que a tela faz

Responde "por onde começo hoje". É a porta da Central: mostra o tamanho da base, onde há vaga
parada, quanta informação já existe por dimensão e o que aconteceu recentemente.

## O que aparece

- **Cabeçalho com o tamanho da base** — empresas, vagas, talentos únicos e candidaturas, recontados
  a partir do estado, não escritos à mão.
- **Filtro por empresa** — recorta os blocos abaixo e fica guardado em `ui.overviewCompanyId`, então
  sobrevive à navegação.
- **Vagas que precisam de ação** — as vagas visíveis com o resumo de cada uma. É daqui que se entra
  na mesa de seleção.
- **Candidaturas por etapa** — distribuição pelas etapas externas recebidas da origem.
- **Cobertura por dimensão** — quanta informação existe nas dimensões técnica, profissional e
  organizacional. Cobertura não é nota: mede informação disponível, não qualidade de candidato.
- **Atividade recente** — histórico local das últimas ações da demonstração.

## De onde vêm os dados hoje

`getOverviewMetrics`, `getStageDistribution`, `getCoverageByDimension`, `getRecentHistory`,
`getSourceBreakdown`, `getVisibleJobs` e `getJobSummary`, todos sobre o estado da demonstração.

## Ações do usuário

- Trocar o filtro de empresa — `set-ui`.
- Abrir uma vaga — navega para a mesa de seleção.

## Backend futuro

- Os contadores viram leitura agregada no servidor (RSC, via `features/<nome>/data/get-*.ts`), em
  vez de um `reduce` sobre a base inteira no navegador.
- "Atividade recente" vira tabela de auditoria com ator, ação, entidade e data — necessária de
  qualquer forma para rastrear as decisões do processo seletivo.
- O filtro por empresa passa a depender de permissão: o analista vê as empresas que atende, não
  todas.

## Regras e limites

- Os números descrevem informação disponível. Nenhum deles ordena pessoas.
- A faixa de dados fictícios fica visível.

## Ligações

Entra em: [Vagas](03-vagas.md), [Mesa de seleção](04-mesa-de-selecao.md),
[Pendências](11-pendencias.md).

## Histórico

- 2026-09-19 — criada.
