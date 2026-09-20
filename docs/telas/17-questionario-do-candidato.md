# Questionário do candidato

**Rota:** `/iel/candidatura/[applicationId]/fit`
**Componente:** `apps/dashboard/components/iel-demo/candidate/fit-questionnaire-screen.tsx`
**Regra:** `apps/dashboard/features/iel-demo/analysis/candidate-questionnaire.ts`
**Persona:** o próprio candidato, sem login
**Última atualização:** 2026-09-19

## O que a tela faz

Coleta as respostas da pessoa nas frases que a empresa daquela vaga escolheu, uma por vez, no
celular, dentro da candidatura. É o lado do candidato que faltava para a aderência existir: sem ele
só há o que a empresa declarou.

Desde que a resposta passou a ser **da pessoa e a valer 12 meses**, a tela só pergunta o que
aquela empresa escolheu **e** a pessoa ainda não respondeu dentro da validade — ver
[Reaproveitamento](#reaproveitamento-a-resposta-é-da-pessoa).

Atende **M3** (questionário do candidato) e **M7** (consentimento).

Existe em duas formas, com a mesma regra e a mesma gravação: esta, em passos, e a
[conversa guiada](#a-porta-para-a-conversa) em `/conversa`.

## Base legal

O tratamento tem como base o **consentimento do titular** — LGPD, art. 7º, I. Por isso o aceite é o
passo 0, ocupa uma tela inteira, **nasce desmarcado** e sem ele o questionário não abre: consentimento
marcado de antemão não é consentimento. A versão do texto aceito vai gravada junto da resposta
(`CANDIDATE_CONSENT_VERSION`), porque sem ela não há como demonstrar depois a que a pessoa consentiu.

As cinco frases do aceite (`CANDIDATE_CONSENT_TEXT`) aparecem **palavra por palavra**, todas no
mesmo cartão e todas no mesmo corpo de leitura. Prazo e direitos ficavam numa nota de 12px cinza
embaixo do cartão, onde ninguém os lia; informação que o art. 9º manda dar de forma "clara,
adequada e ostensiva" não cabe em letra miúda.

## O que aparece

- **Passo 0 — abertura e aceite.** Antes do texto legal, quatro respostas em duas frases: quem está
  perguntando (o IEL), por causa de quê (a vaga em que a pessoa se inscreveu), que não existe
  resposta certa e que ninguém está testando ela. O tamanho da tarefa vem em três etiquetas — "10
  frases · uns 5 minutos · sem cadastro" —, porque quem abre um link sem saber o que é decide
  continuar ou fechar por essa linha. Depois o cartão do aceite, a porta para a conversa, a caixa
  desmarcada e o botão que só habilita quando ela é marcada.
- **As frases da vaga**, uma por tela, com a escala de concordância em cinco alvos de 60px. O
  cabeçalho diz onde a pessoa está e **quantas ainda faltam** ("Frase 3 de 10 · Faltam 7"); no
  meio do caminho a tela diz "Metade do caminho". Ali ficava "cerca de 30 s", que não responde
  nenhuma pergunta de quem está respondendo.
- **Voltar** é um botão de 48px como o de seguir, e a resposta anterior continua marcada. Na
  primeira frase ele se chama "Voltar ao começo"; nas outras, "Voltar uma frase".
- **Confirmação** ao fim: "Pronto!", o que foi recebido e o que foi reaproveitado ("Recebemos as
  suas 7 respostas. As outras 3 vieram do que você já tinha respondido em 01/09"), até quando as
  respostas valem, e **"O que acontece agora"** em três passos numerados — o IEL compara, a empresa recebe só um resumo, e quem avisa é o IEL. O botão
  principal leva para [Minha candidatura](23-minha-candidatura.md); "Responder de novo" fica
  abaixo, em segundo plano.
- **A vaga sem o nome da empresa.** `getCandidateJobView` entrega atividade, localidade, segmento e
  turno; o nome da empresa não aparece antes da entrevista (R5).

## Reaproveitamento: a resposta é da pessoa

`perguntasQueFaltam` substituiu `perguntasDoCandidato` como fonte das frases, e o contador conta o
que falta. Isso cria três situações, e nenhuma delas pode ser silenciosa: mostrar menos perguntas
do que a pessoa esperava, sem dizer por quê, é reuso não informado (LGPD, art. 6º, VI).

| Situação                                      | O que a tela faz                                                                                                                                                      |
| --------------------------------------------- | --------------------------------------------------------------------------------------------------------------------------------------------------------------------- |
| **Nada a perguntar** (`reuso.nadaAPerguntar`) | Tela própria, "Você já respondeu isto": o que vai ser usado, de quando, o aceite, e o botão que despacha `reuse-fit-answers`. Não é formulário vazio.                 |
| **Parcial** (`reuso.reaproveitadas > 0`)      | Cartão antes do aceite: "3 de 10 frases você já respondeu — vieram das suas respostas de 01/09". O questionário pergunta só as 7 que faltam, e o contador diz "de 7". |
| **Vencido** (`reuso.vencidas > 0`)            | Cartão: "Suas respostas anteriores venceram — passou de 12 meses". As frases todas voltam. A tela de prazo vencido também diz isso, porque é onde essa pessoa cai.    |

**"Quero responder de novo" existe em todas elas**, e responde a lista inteira: é o desfazer que o
aceite promete ("vale sempre a sua última resposta"). Sem ele a promessa seria falsa. Meia lista
reaproveitada e meia nova não seria "de novo", então `responderTudo` volta a usar
`perguntasDoCandidato`.

**A confirmação é dela.** `reuse-fit-answers` grava a versão do aceite vigente
(`versaoDoAceiteVigente()`), com o texto atual na tela: quem consentiu sob a versão anterior não
consentiu com o reuso, e reaproveitar em silêncio seria decidir por ela.

**"Já respondeu" deixou de ser "existe registro".** Um registro de 2025 é um registro vencido: a
tela só abre na confirmação quando existe registro **e** não falta nenhuma frase.

## A porta para a conversa

A [conversa guiada](../../app/apps/dashboard/components/iel-demo/chat/conversa-candidato.tsx) existe
para quem tem dificuldade com formulário — e, até 19/09, só chegava lá quem soubesse digitar
`/conversa` no endereço. Quem mais precisa dela é exatamente quem não faria isso. Agora a tela de
abertura oferece "Responder conversando" num cartão próprio, antes do aceite.

## Fechar e voltar

O que já foi respondido fica no **navegador da própria pessoa** (`shared/use-rascunho.ts`), com a
versão do aceite e a lista de frases daquela vaga gravadas junto: rascunho de outro texto de aceite
ou de outra lista de frases é descartado, não reaproveitado. Ela fecha na frase 7, volta depois e
continua na 7, com um aviso em `role="status"` dizendo que voltou de onde parou. O rascunho some no
envio.

**Rascunho não é resposta.** Nada pela metade chega ao estado da demonstração: o reducer só recebe
o questionário completo, com o aceite registrado. É também por isso que o rascunho fica no aparelho
e não no servidor.

## De onde vêm os dados hoje

- `getApplication`, `getCandidateJobView`, `getFitResponse` e `getFitStatus`, em
  `state/selectors.ts`.
- As frases vêm de `perguntasQueFaltam`; a lista inteira, de `perguntasDoCandidato`. O
  reaproveitamento sai de `reaproveitamentoDaCandidatura` e a validade de `validadeDasRespostas`.
- O texto do aceite vem de `CANDIDATE_CONSENT_TEXT`, na versão de `versaoDoAceiteVigente()`.
- As respostas geradas da base ficam em `fixtures/generated.ts` (`fitResponses`).

## Ações do usuário

- Aceitar e responder — `answer-fit-questionnaire`, que grava as respostas e a versão do consentimento.
- Aceitar e confirmar o reuso — `reuse-fit-answers`, quando não há frase nova a perguntar.

## Backend futuro

- O link chega por e-mail ou SMS na candidatura, com token de uso único e prazo.
- As respostas ficam versionadas e revisáveis pela própria pessoa.
- O registro do consentimento (texto, versão, data) é auditável e exportável a pedido do titular.
- O rascunho pode migrar para o servidor quando houver token: hoje ele vive no aparelho porque é o
  único lugar que existe sem login.

## Regras e limites

- **Não é teste psicométrico.** São preferências declaradas de condição de trabalho. O briefing veda
  instrumento psicométrico e entrevista extra; isto não é nem um nem outro.
- **Sem login.** Mais uma etapa de cadastro foi apontada como risco de não adesão.
- **Sem o nome da empresa** antes da entrevista.
- **Sem jargão.** "Fit cultural", "aderência", "instrumento", "eixo" e "tema" não aparecem em
  nenhuma frase que o candidato lê. O que a empresa recebe é "um resumo do quanto vocês combinam".
- **Não responder não reprova.** A ausência vira cobertura menor na aderência, nunca nota zero.
- **Quem responde tem para onde voltar.** O que acontece depois é assunto de
  [Minha candidatura](23-minha-candidatura.md).
- **Nenhum caminho sem saída.** Link inválido, prazo vencido e questionário já respondido dizem o
  que houve e oferecem para onde ir. Se um envio for barrado por frase faltando, um `role="alert"`
  diz qual é e leva até ela.
- **Celular primeiro**: 390×844 sem rolagem horizontal, alvos de 48px (60px nas alternativas),
  corpo de 15px; `h1` por passo, com o foco levado até ele a cada troca de tela.

## Ligações

Vem de: a candidatura e [Minha candidatura](23-minha-candidatura.md). Alimenta:
[Minha candidatura](23-minha-candidatura.md), [Mesa de seleção](04-mesa-de-selecao.md),
[Perfil do talento](08-perfil-do-talento.md) e [Mapa de Cultura](15-mapa-de-cultura.md).

## Histórico

- 2026-09-19 — criada, documentando a tela que chegou com a interface Mind RH.
- 2026-09-19 — a confirmação deixa de terminar em "você não precisa fazer mais nada agora" e passa
  a levar para Minha candidatura. A transparência ("O que está registrado sobre você") sai daqui e
  passa a morar lá, onde a pessoa volta.
- 2026-09-19 — reaproveitamento: a resposta é da pessoa e vale 12 meses. A tela pergunta só o que
  falta, diz o que reaproveitou e de quando, ganha a tela "Você já respondeu isto" com a
  confirmação (`reuse-fit-answers`) e o caminho de responder tudo de novo em qualquer situação.
- 2026-09-19 — rodada de capricho no fluxo por link: abertura que diz quem pergunta e por quê,
  etiquetas com o tamanho da tarefa, prazo e direitos em corpo de leitura, "faltam N" no lugar de
  "cerca de 30 s", porta para a conversa guiada, rascunho no navegador para fechar e voltar, aviso
  de frase faltando em `role="alert"` e correção de quem reabre o link já respondido — que caía na
  tela de aceite porque o passo inicial era decidido antes de o estado chegar do `localStorage`.
