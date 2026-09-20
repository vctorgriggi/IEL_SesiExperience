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

- **Cabeçalho**: "Quem já descreveu como trabalha e quem ainda deve respostas."
- **Busca** por nome, setor ou localidade.
- **Lista de empresas** com setor, localização, contagem de vagas e o **progresso da consulta aos
  colaboradores** — quantos responderam de quantos foram convidados, em barra e em número.

  É esse progresso que diz quais empresas ainda não têm perfil cultural fechado, e portanto para
  quais a aderência não pode ser calculada.

## De onde vêm os dados hoje

`getVisibleCompanies`, `getCultureSampleProgress` e `getJobsByCompany`, sobre `state.cultureInvites`
e os catálogos de empresa.

## Ações do usuário

- Buscar — estado local da tela.
- Abrir o contexto de uma empresa.

## Backend futuro

- Cadastro de empresa vindo do CRM do IEL, não de fixture.
- Vínculo empresa ↔ analista responsável, que passa a definir o que cada analista enxerga.

## Regras e limites

- A descrição institucional é declaração da empresa e aparece como tal; ela não substitui as
  condições informadas pela equipe.

## Ligações

Entra em: [Contexto da empresa](10-contexto-da-empresa.md) e, por ele, no
[Mapa de Cultura](15-mapa-de-cultura.md) daquela empresa.

## Histórico

- 2026-09-19 — criada.
- 2026-09-19 — registra a busca e o progresso da consulta aos colaboradores, que a interface Mind RH
  trouxe para a lista.
