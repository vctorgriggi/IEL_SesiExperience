# Talentos

**Rota:** `/talentos`
**Componente:** `apps/dashboard/components/iel-demo/talents/talents-screen.tsx`
**Persona:** Analista IEL
**Última atualização:** 2026-09-19

## O que a tela faz

Lista as pessoas da base do IEL: uma linha por pessoa, não por candidatura. A mesma pessoa
inscrita em duas vagas continua sendo um perfil só — a duplicação acontece na candidatura.

## O que aparece

- **Busca por nome ou resumo de atuação.**
- **Tabela de perfis** com nome, resumo, candidaturas vinculadas e avaliações externas existentes.
- **Aviso para a persona de gestor**: a base de talentos não é visível para a empresa, com link para
  os perfis encaminhados.

## De onde vêm os dados hoje

`DEMO_TALENTS` via seletores, com `getApplicationsByTalent` e `getAssessments`.

## Ações do usuário

- Buscar (estado local da tela).
- Abrir um perfil.

## Backend futuro

- Busca e paginação no servidor; a base real tem ordem de grandeza maior que a demo.
- Acesso ao perfil passa a ser registrado: quem abriu, quando e em que contexto de vaga.

## Regras e limites

- A base de talentos é do IEL. Empresa nenhuma navega por ela.
- A lista não ordena pessoas por adequação.

## Ligações

Entra em: [Perfil do talento](08-perfil-do-talento.md).

## Histórico

- 2026-09-19 — criada.
