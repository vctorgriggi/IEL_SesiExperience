# Fontes de dados

**Rota:** `/fontes-de-dados`
**Componente:** `apps/dashboard/components/iel-demo/sources/data-sources-screen.tsx`
**Persona:** Analista IEL
**Última atualização:** 2026-09-19

## O que a tela faz

Mostra de onde vem cada tipo de informação e o que acontece quando uma fonte cai. É a tela que
sustenta a promessa de integração do produto. O que ainda é simulado por trás dela fica em
`docs/interno/o-que-e-simulado.md`, não na tela.

## O que aparece

- **Cabeçalho**: "De onde vem cada tipo de informação, com a última atualização recebida."
- **Lista de fontes** — Empregare, avaliação externa, contexto da empresa e registro IEL — com tipo,
  descrição, última sincronização, registros recebidos, situação e último erro.
- **Recebimento de atualização** — aplica um evento de sincronização e mostra o efeito nas telas.
- **O que fica de fora** — o que o Mind RH não recebe nem envia, dito como fato de produto.

## De onde vêm os dados hoje

`state.dataSources` e `DEMO_SYNC_EVENTS`, em `fixtures/clarifications.ts`.

## Ações do usuário

- Marcar uma fonte como ativa ou indisponível — `set-source-status`.
- Aplicar um evento de atualização — `apply-sync-event`.
- Recarregar a base — `hydrate`.

## Backend futuro

- Conectores reais com credenciais, agenda de sincronização, reprocessamento e fila de erro.
- Cada registro recebido guarda origem, data de recebimento e identificador externo, que é o que
  torna a rastreabilidade possível nas demais telas.
- Situação da fonte vira monitoramento, com alerta quando a informação para de chegar.

## Regras e limites

- Fonte indisponível não pode ser disfarçada: as telas precisam mostrar dado desatualizado como
  desatualizado.
- Os nomes das fontes são os do produto ("Empregare", "Avaliação externa", "Contexto da empresa",
  "Registro IEL"), sem sufixo de demonstração; a descrição diz o que a fonte é, não que é fictícia.

## Ligações

Afeta todas as telas que exibem origem de informação, especialmente
[Mesa de seleção](04-mesa-de-selecao.md) e [Perfil do talento](08-perfil-do-talento.md).

## Histórico

- 2026-09-19 — criada.
