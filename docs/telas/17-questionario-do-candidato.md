# Questionário do candidato

**Rota:** `/iel/candidatura/[applicationId]/fit`
**Componente:** `apps/dashboard/components/iel-demo/candidate/fit-questionnaire-screen.tsx`
**Regra:** `apps/dashboard/features/iel-demo/analysis/candidate-questionnaire.ts`
**Persona:** o próprio candidato, sem login
**Última atualização:** 2026-09-19

## O que a tela faz

Coleta as respostas da pessoa nos cinco eixos de ambiente de trabalho, uma pergunta por vez, no
celular, dentro da candidatura. É o lado do candidato que faltava para a aderência existir: sem ele
só há o que a empresa declarou.

Atende **M3** (questionário do candidato) e **M7** (consentimento).

## Base legal

O tratamento tem como base o **consentimento do titular** — LGPD, art. 7º, I. Por isso o aceite é o
passo 0, ocupa uma tela inteira, **nasce desmarcado** e sem ele o questionário não abre: consentimento
marcado de antemão não é consentimento. A versão do texto aceito vai gravada junto da resposta
(`CANDIDATE_CONSENT_VERSION`), porque sem ela não há como demonstrar depois a que a pessoa consentiu.

## O que aparece

- **Passo 0 — aceite**: a finalidade em texto corrido, a caixa desmarcada e o botão que só habilita
  depois de marcada.
- **Cinco perguntas**, uma por tela, com as alternativas do mesmo vocabulário que a empresa responde.
- **Confirmação** ao fim, com o que foi registrado.
- **A vaga sem o nome da empresa.** `getCandidateJobView` entrega atividade, localidade, segmento e
  turno; o nome da empresa não aparece antes da entrevista (R5).

## De onde vêm os dados hoje

- `getApplication`, `getTalent`, `getCandidateJobView`, `getFitResponse` e `getFitStatus`, em
  `state/selectors.ts`.
- As perguntas vêm de `CANDIDATE_FIT_QUESTIONS`, o texto do aceite de `CANDIDATE_CONSENT_TEXT`.
- As respostas geradas da base ficam em `fixtures/generated.ts` (`fitResponses`).

## Ações do usuário

- Aceitar e responder — `answer-fit-questionnaire`, que grava as respostas e a versão do consentimento.

## Backend futuro

- O link chega por e-mail ou SMS na candidatura, com token de uso único e prazo.
- As respostas ficam versionadas e revisáveis pela própria pessoa.
- O registro do consentimento (texto, versão, data) é auditável e exportável a pedido do titular.

## Regras e limites

- **Não é teste psicométrico.** São preferências declaradas de condição de trabalho, respondidas uma
  vez por candidatura. O briefing veda instrumento psicométrico e entrevista extra; isto não é nem um
  nem outro.
- **Sem login.** Mais uma etapa de cadastro foi apontada como risco de não adesão.
- **Sem o nome da empresa** antes da entrevista.
- **Não responder não reprova.** A ausência vira cobertura menor na aderência, nunca nota zero.

## Ligações

Vem de: a candidatura. Alimenta: [Mesa de seleção](04-mesa-de-selecao.md),
[Perfil do talento](08-perfil-do-talento.md) e [Mapa de Cultura](15-mapa-de-cultura.md).

## Histórico

- 2026-09-19 — criada, documentando a tela que chegou com a interface Mind RH.
