# Vagas

**Rota:** `/vagas`
**Componente:** `apps/dashboard/components/iel-demo/jobs/jobs-screen.tsx`
**Persona:** Analista IEL (o gestor vê apenas as vagas da própria empresa)
**Última atualização:** 2026-09-19

## O que a tela faz

Lista as vagas em tabela ordenável, com busca e filtros. É a tela que dá conta do volume: a base tem
centenas de candidaturas, e sem filtro não há triagem possível.

## O que aparece

- **Busca por texto** e **filtros** de empresa e de etapa, guardados em `ui.jobsSearch`,
  `ui.jobsCompanyId` e `ui.jobsStage`.
- **Tabela** com título, empresa, etapa, contagem de candidaturas, pendências e última atualização.
  Colunas ordenáveis (TanStack Table).
- **Contador de vagas visíveis** no cabeçalho.

## De onde vêm os dados hoje

`getVisibleJobs` e `getJobSummary` sobre o estado. A visibilidade já respeita a persona.

## Ações do usuário

- Buscar, filtrar e ordenar — `set-ui` para o que precisa sobreviver à navegação.
- Abrir a mesa de seleção de uma vaga.

## Backend futuro

- Busca, filtro, ordenação e paginação passam para o servidor; a tabela recebe uma página por vez.
- As vagas deixam de ser fixture e vêm da integração com o sistema de recrutamento (Empregare, na
  demonstração), com sincronização incremental e marca de última atualização por registro.

## Regras e limites

- A contagem de candidaturas é informação de processo, não classificação de pessoas.

## Ligações

Entra em: [Mesa de seleção](04-mesa-de-selecao.md).

## Histórico

- 2026-09-19 — criada.
