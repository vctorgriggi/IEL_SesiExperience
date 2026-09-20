# Fontes de dados

**Rota:** `/fontes-de-dados`
**Componente:** `apps/dashboard/components/iel-demo/sources/data-sources-screen.tsx`
**Persona:** Analista IEL
**Última atualização:** 2026-09-19

## O que a tela faz

Mostra de onde vem cada tipo de informação e o que acontece quando uma fonte cai. É a tela que
sustenta a promessa de integração do produto — e a que admite, por escrito, o que é simulado.

## O que aparece

- **Cabeçalho**: "De onde vem cada tipo de informação, com a última atualização recebida."
- **Lista de fontes** — Empregare, avaliação externa, contexto da empresa e registro IEL — com tipo,
  descrição, última sincronização, registros recebidos, situação e último erro.
- **Recebimento de atualização simulada** — aplica um evento de sincronização e mostra o efeito nas
  telas.
- **O que é simulado nesta demonstração** — os limites, escritos na própria interface.

## De onde vêm os dados hoje

`state.dataSources` e `DEMO_SYNC_EVENTS`, em `fixtures/clarifications.ts`.

## Ações do usuário

- Marcar uma fonte como ativa ou indisponível — `set-source-status`.
- Aplicar um evento de atualização — `apply-sync-event`.
- Recarregar a base da demonstração — `hydrate`.

## Backend futuro

- Conectores reais com credenciais, agenda de sincronização, reprocessamento e fila de erro.
- Cada registro recebido guarda origem, data de recebimento e identificador externo, que é o que
  torna a rastreabilidade possível nas demais telas.
- Situação da fonte vira monitoramento, com alerta quando a informação para de chegar.

## Regras e limites

- Fonte indisponível não pode ser disfarçada: as telas precisam mostrar dado desatualizado como
  desatualizado.
- A tela declara explicitamente o que é simulado, para que a demonstração não prometa integração que
  ainda não existe.

## Ligações

Afeta todas as telas que exibem origem de informação, especialmente
[Mesa de seleção](04-mesa-de-selecao.md) e [Perfil do talento](08-perfil-do-talento.md).

## Histórico

- 2026-09-19 — criada.
