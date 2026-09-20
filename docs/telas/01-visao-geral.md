# Visão geral

**Rota:** `/`
**Componentes:** `apps/dashboard/components/iel-demo/overview/overview-screen.tsx`,
`overview/pendencias.ts`
**Persona:** Analista IEL (o gestor cai em [Painel da empresa](02-painel-da-empresa.md))
**Última atualização:** 2026-09-19

## O que a tela faz

Responde **uma** pergunta: o que precisa de mim hoje?

Ela já foi um painel administrativo — cinco números no herói, distribuição por etapa, cobertura por
dimensão, atividade recente e a procedência dos registros. Nada daquilo dizia por onde começar, e era
isso que a analista precisava. Ficou uma fila de no máximo cinco cartões, cada um com o verbo que o
resolve.

## O que aparece

- **Título e uma linha**: "A fila do dia, na ordem em que compensa resolver."
- **Até cinco pendências** (`PENDENCIAS_VISIVEIS`), uma por cartão, com título, resumo e o verbo da
  ação que a encerra.
- **Estado vazio** quando não há nada em aberto, dizendo o que faria uma linha aparecer.

## A ordem da fila

`urgencia` existe para ordenar, e a ordem não é arbitrária:

1. o que já tem **resposta esperando** para ser usada;
2. o que está **parado à espera de alguém**;
3. o que só precisa de **conferência**.

Quem abre a tela de manhã deve conseguir descer a lista de cima para baixo.

## De onde vêm os dados hoje

`montarPendencias`, em `overview/pendencias.ts`, monta a fila a partir do estado atual das vagas e
das empresas — cobertura do perfil cultural, questionários pendentes, pedidos respondidos e listas de
encaminhamento em aberto.

## Ações do usuário

- Abrir uma pendência — navega para a tela que a resolve. Nenhuma ação de reducer nasce aqui.

## Backend futuro

- A fila passa a ser consultada no servidor, com o recorte do analista responsável.
- Notificação por e-mail do que entrou na fila, com a mesma ordem.

## Regras e limites

- **Não é painel de métrica.** A tela não pontua ninguém e não exibe ranking.
- **Cada linha tem dono e verbo.** Pendência sem ação possível não entra na fila.
- **O gestor não vê esta tela**: cai em [Painel da empresa](02-painel-da-empresa.md), com o recorte
  da própria empresa.

## Ligações

Entra em: [Mesa de seleção](04-mesa-de-selecao.md), [Contexto da empresa](10-contexto-da-empresa.md),
[Pendências](11-pendencias.md), [Preparação do encaminhamento](06-preparacao-do-encaminhamento.md).

## Histórico

- 2026-09-19 — criada.
- 2026-09-19 — reescrita: o painel de métricas deu lugar à fila do dia, com no máximo cinco
  pendências ordenadas por urgência.
