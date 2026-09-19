# Consulta ao colaborador

**Rota:** `/iel/consulta/[token]`
**Componente:** `apps/dashboard/components/iel-demo/companies/culture-invite-screen.tsx`
**Regra:** `apps/dashboard/features/iel-demo/analysis/culture-invites.ts`
**Persona:** quem trabalha na empresa e recebeu o link, sem login
**Última atualização:** 2026-09-19

## O que a tela faz

Responde uma pergunta — "como é trabalhar aqui?" — em cinco telas, uma pergunta por vez. É o que
forma o perfil cultural da empresa por **amostra de colaboradores**, e não pela opinião de uma pessoa
só.

Quem abre isto é um colaborador operacional, no celular, no intervalo do turno: uma alternativa por
vez, alvos de 60px, um botão só, nada para configurar. A tela cabe em 390px sem rolagem.

Atende **M2** (link por colaborador) e **M7** (consentimento).

## Base legal

Consentimento do titular — LGPD, art. 7º, I. O aceite é o passo 0, nasce desmarcado, e sem ele o
questionário não abre. A versão do texto vai gravada junto da resposta.

## O que a tela não mostra

- **Ninguém mais.** Não há lista de colegas, contagem de quem já respondeu nem média parcial. Quem
  responde sobre o próprio ambiente não pode ver — nem ser visto por — os outros respondentes: a
  empresa recebe a média, nunca "fulano respondeu isto" (PRODUTO.md §5).
- **Nem o próprio e-mail.** `getInviteByToken` devolve só o primeiro nome, a empresa e o prazo. Um
  link vazado não vira vazamento de dado pessoal.

## O que aparece

- **Passo 0 — aceite**, com a finalidade e a caixa desmarcada.
- **Cinco perguntas**, uma por tela.
- **Confirmação** ao fim.

## De onde vêm os dados hoje

- `getInviteByToken`, em `state/selectors.ts`, sobre `fixtures/culture-invites.ts`.
- As perguntas vêm de `CULTURE_QUESTIONS`.

## Ações do usuário

- Aceitar e responder — `answer-culture-invite`, que marca o convite como respondido e soma a resposta
  à média da empresa.

## Backend futuro

- O analista cadastra nome e e-mail dos convidados; o sistema gera um link por pessoa, com prazo.
- Token de uso único: o mesmo link não responde duas vezes.
- A agregação acontece no servidor, com o mínimo de respostas aplicado **antes** de devolver qualquer
  resultado.

## Regras e limites

- **Equipe anônima e agregada.** `MIN_TEAM_RESPONSES` é respeitado: abaixo dele o eixo não fecha e a
  tela da empresa diz isso, em vez de tratar duas pessoas como "a equipe".
- **Sem login**, para não criar barreira de adesão.
- **O link não expõe dado pessoal** de quem o recebeu.

## Ligações

Vem de: [Contexto da empresa](10-contexto-da-empresa.md), que dispara os convites. Alimenta o perfil
cultural usado em [Mesa de seleção](04-mesa-de-selecao.md) e [Mapa de Cultura](15-mapa-de-cultura.md).

## Histórico

- 2026-09-19 — criada, documentando a tela que chegou com a interface Mind RH.
