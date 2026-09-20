# Consulta ao colaborador

**Rota:** `/consulta/[token]`
**Componente:** `apps/dashboard/components/iel-demo/companies/culture-invite-screen.tsx`
**Regra:** `apps/dashboard/features/iel-demo/analysis/culture-invites.ts`
**Persona:** quem trabalha na empresa e recebeu o link, sem login
**Última atualização:** 2026-09-20

## O que a tela faz

Responde uma pergunta — "como é trabalhar aqui?" — pelas 16 frases do bloco daquele convite
(amostragem em matriz sobre as 52 do instrumento), uma frase por tela. É o que forma o perfil
cultural da empresa por **amostra de colaboradores**, e não pela opinião de uma pessoa só.

Quem abre isto é um colaborador operacional, no celular, no intervalo do turno: uma alternativa por
vez, alvos de 60px, um botão só, nada para configurar. A tela cabe em 390px sem rolagem horizontal.

Atende **M2** (link por colaborador) e **M7** (consentimento). Existe em duas formas, com a mesma
regra e a mesma gravação: esta, em passos, e a [conversa guiada](#a-porta-para-a-conversa) em
`/conversa`.

## Por que esta tela importa mais do que parece

Conseguir estas respostas é o gargalo declarado do cliente: _"dos 10, só 5 responderam. A gente
cobra a empresa… é um gargalo também, a gente tem que ficar em cima"_ (00:44:15). Cada pessoa que
abre o link e desiste é um tema do perfil que não fecha, e um perfil que não fecha é uma vaga sem
fit. O desenho da tela ataca as três causas de abandono: não entender quem está pedindo, não saber
quanto tempo vai levar e achar que a resposta volta para a chefia.

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

- **Passo 0 — abertura e aceite.** Primeiro, em duas frases: quem pediu, com nome ("A equipe do
  IEL que atende a Cerrado Distribuição pediu a opinião de quem vive o dia a dia daí. Por isso
  você recebeu este link.") e que não existe resposta certa — "responda pelo que acontece de verdade, não pelo que deveria acontecer". Depois
  três etiquetas com o tamanho da tarefa ("16 frases · uns 5 minutos · sem cadastro"), o **cartão
  do anonimato** (ver abaixo), o cartão do aceite, a porta para a conversa, a caixa desmarcada e o
  botão que só habilita quando ela é marcada.
- **As 16 frases do bloco como cenas**, uma por tela. O título é a `cena` do instrumento — a mesma
  ideia da frase do cliente, na primeira pessoa e no chão de fábrica ("Entendi a tarefa? Vou até o
  fim sem ficar perguntando a cada passo.") —, com a pergunta de apoio "O quanto isso é assim aí?"
  e um toque discreto, "ver a frase original", que abre a frase da planilha. O cabeçalho diz onde
  a pessoa está e **quantas ainda faltam** ("Frase 8 de 16 · Faltam 8"); na oitava, a tela diz
  "Metade do caminho".
- **A régua de um toque** (`shared/regua-de-concordancia.tsx`): cinco degraus lado a lado, de
  72px, com o número e a palavra escrita — "Não é assim aqui · Pouco · Depende · Quase sempre · É
  bem assim aqui" —, os extremos com peso maior. Quem responde descreve o **ambiente**, não a si,
  e por isso os degraus não dizem "Sou eu"; o degrau tocado se preenche no azul da empresa, que é
  o lado que a resposta forma (DESIGN.md §8, "Cor nos dados"). O toque seleciona e, 350 ms depois,
  a tela avança; "Próxima" continua para quem prefere o botão, para quem voltou a uma frase já
  respondida e para o teclado (setas escolhem, Enter confirma). Na última, "Enviar respostas" é um
  gesto à parte.
- **Voltar** é um botão de 48px como o de seguir — era um `<button>` sublinhado de 13px, pequeno
  demais para o polegar. A resposta anterior continua marcada.
- **Confirmação** ao fim: "Resposta registrada", a **devolutiva pessoal**
  (`shared/leitura-pessoal.tsx`, montada só com as 16 respostas que acabaram de ser enviadas, sem
  nome; quem reabre o link depois não a vê, porque a resposta já virou média) e **"O que acontece
  agora"** em três passos — a
  resposta entra numa média, a média descreve a empresa quando gente suficiente responder, e este
  link não abre de novo.

## A cena e a régua

Mesma decisão do [questionário do candidato](17-questionario-do-candidato.md#a-cena-e-a-régua-por-que-mudou):
o instrumento não muda — mesmas 52 frases, mesma escala, mesma média —, a `cena` é apresentação,
e a frase original fica a um toque. O que é próprio daqui: a régua do colaborador
(`ROTULOS_DA_REGUA.colaborador`) fala do lugar, não da pessoa, e preenche em azul. Os valores são
os mesmos que a analista lê como "Discordo muito … Concordo muito".

A marca da empresa entraria na abertura, ao lado de quem pediu; `Company` não tem campo de logo, e
sem campo nada foi inventado.

## O cartão do anonimato

A promessa de anonimato é o que decide se a resposta é honesta: a pessoa está dizendo como é
trabalhar na empresa dela, e a chefia pode estar do lado. Por isso ela saiu do terceiro parágrafo
do texto legal e virou um cartão próprio, antes do aceite: _"Ninguém vai saber o que você
respondeu. Sua resposta não fica com o seu nome. Ela entra numa média com a de todo mundo que
responder. Nem a empresa, nem a sua chefia, nem o IEL veem a sua resposta sozinha."_

O "nem o IEL" é verdade e está na matriz de acesso: o analista vê o agregado por tema, nunca a
resposta individual (PRODUTO.md §5.1).

## A porta para a conversa

A [conversa guiada](../../app/apps/dashboard/components/iel-demo/chat/conversa-colaborador.tsx)
existe para quem tem dificuldade com formulário — e, até 19/09, só chegava lá quem soubesse digitar
`/conversa` no endereço. Agora a tela de abertura oferece "Responder conversando", antes do aceite.

## Fechar e voltar

São 16 frases no intervalo do turno: interrupção é o caso comum, não a exceção. O que já foi
respondido fica no **navegador da própria pessoa** (`shared/use-rascunho.ts`), preso à versão do
aceite e ao bloco daquele convite; ela fecha na frase 7, volta depois e continua na 7, com um aviso
em `role="status"`. O rascunho some no envio. A retomada não olha o status do convite: a base da
demonstração chega do navegador depois da primeira renderização, e um convite que a analista
reenviou ao vivo ainda parece vencido nesse instante — se o link não estiver aberto, as telas de
vencido e respondido vêm antes do passo e o rascunho simplesmente não aparece.

**Rascunho não é resposta.** Nada pela metade chega ao estado da demonstração, e é por isso que o
rascunho fica no aparelho, não no servidor.

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
- **Nenhum caminho sem saída.** Link inexistente, vencido e já respondido dizem o que houve e o que
  fazer — o vencido com a data e com quem procurar. Um envio barrado por frase faltando vira um
  `role="alert"` que diz qual é e leva até ela.
- **Celular primeiro**: 390×844 sem rolagem horizontal, alvos de 48px (72px nos degraus da
  régua), corpo de 15px; `h1` por passo, com o foco levado até ele a cada troca de tela.

## Ligações

Vem de: [Contexto da empresa](10-contexto-da-empresa.md), que dispara os convites. Alimenta o perfil
cultural usado em [Mesa de seleção](04-mesa-de-selecao.md) e [Mapa de Cultura](15-mapa-de-cultura.md).

## Histórico

- 2026-09-19 — criada, documentando a tela que chegou com a interface Mind RH.
- 2026-09-19 — rodada de capricho no fluxo por link: abertura que diz quem pergunta e por que essa
  pessoa foi escolhida, "não existe resposta certa nem errada", etiquetas com o tamanho da tarefa,
  o anonimato promovido a cartão próprio antes do aceite, "faltam N" e "metade do caminho" na fila
  de 16, "Voltar" com 48px, porta para a conversa guiada, rascunho no navegador para fechar e
  voltar, encerramento com "o que acontece agora" e aviso de frase faltando em `role="alert"`.
- 2026-09-20 — cena na primeira pessoa e régua de um toque: a frase vira `cena` em título grande,
  com "ver a frase original" a um toque; as cinco bolinhas viram a régua "Não é assim aqui … É bem
  assim aqui", em azul, que seleciona e avança; a abertura diz quem pediu com nome; a devolutiva
  pessoal entra no fim, acima de "O que acontece agora"; a retomada do rascunho deixa de depender
  do status do convite na primeira renderização. Instrumento, escala e média intactos.
