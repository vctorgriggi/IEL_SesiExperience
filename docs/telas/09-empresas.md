# Empresas

**Rota:** `/iel/empresas`
**Componente:** `CompaniesScreen`, em
`apps/dashboard/components/iel-demo/companies/companies-screens.tsx`
**Persona:** Analista IEL
**Última atualização:** 2026-09-19

## O que a tela faz

Lista as empresas atendidas, com a descrição institucional declarada e o caminho para o contexto
concreto de cada equipe. Serve para sair da descrição de marketing e chegar em como o trabalho
acontece.

## O que aparece

- **Cabeçalho**: "Descrição institucional e condições concretas de cada equipe."
- **Lista de empresas** com setor, localização e contagem de vagas e equipes.

## De onde vêm os dados hoje

`DEMO_COMPANIES` via seletores, com equipes e vagas associadas do estado.

## Ações do usuário

- Abrir o contexto de uma empresa.

## Backend futuro

- Cadastro de empresa vindo do CRM do IEL, não de fixture.
- Vínculo empresa ↔ analista responsável, que passa a definir o que cada analista enxerga.

## Regras e limites

- A descrição institucional é declaração da empresa e aparece como tal; ela não substitui as
  condições informadas pela equipe.

## Ligações

Entra em: [Contexto da empresa](10-contexto-da-empresa.md).

## Histórico

- 2026-09-19 — criada.
