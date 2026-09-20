# Cena do candidato

**Rota:** `/cena/candidato/[applicationId]` (`/cena/candidato` abre `CAND-21`, o Jonas)
**Componente:** `CenaDoCandidato`, em `apps/dashboard/components/iel-demo/cena/cena-do-candidato.tsx`
(roteiro e tempos em `cena/roteiro.ts`; o celular em `cena/celular.tsx`; os atos em `cena/tela-portal.tsx`,
`cena/tela-mensagens.tsx` e `cena/tela-questionario.tsx`; a página em `app/(cena)/cena/candidato/[id]/page.tsx`)
**Persona:** quem apresenta, no telão; no terceiro ato, o próprio candidato
**Última atualização:** 2026-09-20

## O que a tela faz

Conta em três atos, num celular desenhado no centro do telão, o caminho que a pessoa faz até o
questionário: ela se candidata no portal, recebe a mensagem do IEL e abre o link. No terceiro ato o
celular deixa de ser cenário — o que aparece nele é o **questionário real** (`/candidatura/[id]/fit`),
e quem apresenta responde ali mesmo. As respostas gravam no mesmo estado que a mesa da analista lê.

A cena não se apresenta como ensaio: a legenda conta a história, e só. O nome da empresa não aparece
em nenhum ato (R5) — a vaga é atividade, localidade, turno e segmento, como em `getCandidateJobView`.

## O que aparece

- **Palco**: fundo azul-noite da marca (`--sidebar`), com duas luzes do mesmo azul e um grão leve.
  Cabeçalho com "Mind RH · IEL · Centro de Empregos da Indústria" e, à direita, **Pular para o
  questionário** (some quando o questionário está aberto e dá lugar a **Abrir em tela cheia**, que
  abre a rota real numa aba nova).
- **Legenda** (à esquerda no telão; em cima no celular de verdade), uma frase por ato, em marfim, com
  "Ato N de 3 · nome" acima e `aria-live="polite"`:
  1. "Jonas se candidata pelo portal a uma vaga de assistente de suporte e testes."
  2. "O IEL manda o convite. A empresa não aparece."
  3. "Sem senha, sem cadastro: **N** frases no celular." — N é contado na página, no servidor
     (`perguntasQueFaltam(estado, applicationId).length`), porque não é constante: a empresa escolhe
     de 3 a 11 competências e o que a pessoa já respondeu em outra vaga é reaproveitado. Com N = 1,
     "1 frase"; com N = 0 (tudo reaproveitado), "Sem senha, sem cadastro: é só confirmar."
     A contagem é tirada quando a cena abre e **fica parada**: quem apresenta responde dentro do
     celular, e ler o estado vivo faria a legenda cair para "é só confirmar" no meio do ato.
- **Celular**: 390×820 de tela, moldura de 10 px, ilha no topo, hora "09:14". É desenhado em pixels
  fixos e reduzido por `transform: scale` para caber sem rolagem em 1440×900, 1920×1080 e 390×844.
- **Ato 1 — Portal** (~4,8 s): cabeçalho "Portal de vagas · Empregare", cartão da vaga `VAG-06`
  (segmento, título, cidade, turno, três linhas de resumo, dois requisitos) e o botão
  "Candidatar-se". Um dedo translúcido desce até o botão (mola), o botão afunda, e no lugar dele entra
  o check com mola, "Candidatura enviada" e oito faíscas curtas nas cores da marca.
- **Ato 2 — Mensagem** (~11,3 s): um app de mensagens neutro (sem verde, sem logo de terceiros).
  A notificação "IEL — Centro de Empregos" desce do topo e recolhe; "digitando…" com três pontos; a
  bolha com a mensagem **real** de `gerarMensagem` (etapa `convite-questionario`,
  `features/iel-demo/analysis/mensagens.ts`), com o link `mindrh.iel.org.br/c/CAND-21` sublinhado em
  azul. O link é texto: quem abre o questionário é o ato seguinte.
  A regra fixa escreve "10 frases" no convite, de quando toda empresa perguntava dez; a cena troca
  esse número pelo desta candidatura (`comAContagemCerta`, na página), para a bolha e a tela não
  dizerem coisas diferentes. Mesma frase, mesmo tom, número verdadeiro — e nada muda para a
  analista, que envia pela mesma função. Se a regra passar a dizer o número certo sozinha, a troca
  vira inofensiva; se mudar de redação a ponto de não casar, o texto sai intacto.
- **Ato 3 — Questionário** (~2,7 s até abrir, depois fica): o dedo vai ao link, a bolha pulsa e o link
  acende, a conversa se desfaz em blur, "Abrindo o questionário" com a marca, e entra a tela real.
  Dali em diante, toque e teclado dentro do celular são do questionário.
- **Barra de progresso** no rodapé: três segmentos com nome (Portal · Mensagem · Questionário). O ato
  em curso enche em laranja no ritmo do relógio; os passados ficam cheios em marfim. Abaixo, a dica
  "→ avança · ← volta · Esc reinicia".

## Controles

- Os atos avançam sozinhos; **clique** no palco, **→** ou **espaço** pulam para o próximo ato;
  **←** volta ao anterior; **Esc** reinicia (o celular remonta e as entradas animam de novo).
- No terceiro ato, teclas e cliques dentro do celular são do questionário: o palco não reage a eles.
- `prefers-reduced-motion`: sem deslocamento do dedo, sem faíscas, sem blur, transições instantâneas;
  os tempos continuam os mesmos.

## Como o questionário entra no celular

O produto manda `X-Frame-Options: deny` em toda resposta (`next.config.ts`), o que fecha o iframe até
para a mesma origem. Com `SECURITY_X_FRAME_OPTIONS=sameorigin` a página real entra num `<iframe>` de
390 px, com título acessível. Sem essa variável, o celular monta o próprio `FitQuestionnaireScreen`
com o mesmo cabeçalho da tela por link — a mesma tela, o mesmo estado, sem passar pela rede. A
decisão é da página, no servidor (`modoDoQuestionario`).

**O iframe tem uma chance só.** Um quadro recusado por cabeçalho não avisa — dispara `load` com a
página de erro do navegador e fica um retângulo vazio, que no telão é a cena morrendo no último ato.
Então o `load` só conta como sucesso quando o documento de dentro pode ser lido e tem conteúdo (na
mesma origem é verdade; num bloqueio, não), e um relógio de **3 s** derruba o iframe se nada chegar.
Caindo, monta o componente direto e não volta atrás: trocar de novo perderia o que já foi respondido
na tela.

Dentro do celular, a `MolduraPorLink` passa a medir a tela do aparelho em vez da janela
(`cena/cena.css`), para o botão "Próxima" ficar no pé do celular.

## Onde mora e por que fica fora da casca

A rota vive no grupo `app/(cena)`, fora de `(iel)`: aquele layout põe a barra lateral e exige a
sessão da analista em tudo o que não chega por link. A cena é tela cheia, sem menu e sem senha, e
compartilha com o produto só o que precisa — o tema (`iel-theme.css`), a fonte e o estado da sala
(`IelDemoProvider` com `lerSala`). Não entra na navegação lateral: chega por URL
(`routes.dashboard.iel.cenaCandidato(id)`).

## Acessibilidade

`h1` visualmente oculto ("Jonas se candidata"); a legenda em `aria-live="polite"`; os dois primeiros
atos são cenário (`aria-hidden`), e o terceiro volta a ser lido porque é a tela real; botões do palco
por teclado; o iframe, quando há, tem título.

## Dados

A página lê **o mesmo estado com que o `IelDemoProvider` do layout começa**: a sala compartilhada
quando `IEL_ESTADO_COMPARTILHADO=1` e há banco, as fixtures quando não. São dois motivos: as
competências que a empresa escolhe moram no estado da demonstração, não nas fixtures, e a legenda é
escrita no HTML do servidor — começar de outro estado trocaria o texto no primeiro quadro.

De lá saem `getApplication`, `getTalent`, `getJob`, `getCandidateJobView` e `perguntasQueFaltam`. Se
a candidatura não existir, `notFound()`. A biblioteca de animação é `motion` (`motion/react`).
