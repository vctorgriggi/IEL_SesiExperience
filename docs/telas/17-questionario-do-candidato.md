# Questionário do candidato

**Rota:** `/candidatura/[applicationId]/fit`
**Componente:** `apps/dashboard/components/iel-demo/candidate/fit-questionnaire-screen.tsx`
**Regra:** `apps/dashboard/features/iel-demo/analysis/candidate-questionnaire.ts`
**Persona:** o próprio candidato, sem login
**Última atualização:** 2026-09-23

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
passo 0, **nasce desmarcado** e sem ele o questionário não abre. A versão do texto aceito vai
gravada junto da resposta (`CANDIDATE_CONSENT_VERSION`, hoje `2026-09-23`), porque sem ela não há
como demonstrar depois a que a pessoa consentiu — mas a versão **não aparece na tela**: é
rastreabilidade, não leitura.

O que a pessoa lê é o **aceite curto** (`shared/fluxo-por-link.tsx`, `AceiteCurto`): o título
"Antes de responder", **três linhas** em palavra comum (`CANDIDATE_CONSENT_RESUMO` — o que você
responde e para quê · quem vê · por quanto tempo vale), a caixa "Li e aceito" e o botão. O texto
inteiro (`CANDIDATE_CONSENT_TEXT`, cinco frases) existe palavra por palavra atrás de "Ler o texto
completo", recolhido. Resumo e texto são versionados juntos.

## O que aparece

Três telas, e o que não é a pergunta, a régua ou o botão de seguir não está nelas. O dono do
produto foi literal (20/09/2026): _"muita informação desnecessária… enxuga bastante, deixa menos
etapas"_.

- **Abertura.** "Como você prefere trabalhar?", uma linha (quem pergunta, para qual vaga, que não
  existe resposta certa), as três etiquetas — "7 frases · uns 5 minutos · sem cadastro" —, uma
  linha de reaproveitamento quando houver ("3 já valem de uma vaga anterior; faltam 7"), o aceite
  curto e, no rodapé, o link "Prefere responder conversando?".
- **As frases da vaga, como o cliente as escreveu**, uma por tela: "3 de 7" pequeno no topo com a
  barra, o `texto` da planilha em título grande, sem edição, "O quanto isso é você?", a **régua de um toque** ("Nada a ver comigo · Pouco ·
  Mais ou menos · Bastante · Sou eu"), "Próxima" e um "Voltar" discreto. Nada mais: sem frase
  original, sem "faltam N", sem "metade do caminho", sem aviso de retomada.
- **Fim.** "Pronto, Jonas.", uma linha (o IEL compara com a empresa desta vaga; se o currículo for
  enviado, a empresa vê só o quanto combina), o bloco **"Suas respostas"** e **um** botão, "Ver
  minha candidatura".
- **A vaga sem o nome da empresa.** `getCandidateJobView` entrega atividade, localidade, segmento e
  turno; o nome da empresa não aparece antes da entrevista (R5).

## "Suas respostas": linha de teste, não leitura

A devolutiva pessoal (`shared/leitura-pessoal.tsx` — traços, "um lugar que combina com você",
polimento pelo Mind) **saiu das telas de quem responde**. O dono do produto: _"o resultado não pode
falar 'você é assim, assim e assado', porque isso entra no viés; tem que mostrar como aquelas
linhas de teste mesmo"_. O instrumento não classifica pessoa (PRODUTO.md §11), e uma frase sobre
quem a pessoa é, por mais gentil, classifica.

No lugar, `shared/suas-respostas.tsx`: uma linha por frase respondida — a **frase do cliente** e, à direita, o
grau no vocabulário da escala (`rotuloDaEscala`: _Discordo muito · Discordo · Tanto faz · Concordo
· Concordo muito_), em ordem de tema. Sem percentual, sem comparação, sem adjetivo. Rodapé: "É o
que você respondeu. Ninguém vê suas respostas uma a uma além da equipe do IEL." O componente e a
rota da leitura pessoal continuam existindo para a analista; só não entram aqui.

## Uma resposta só

**Não há "responder de novo" em lugar nenhum** — nem no formulário, nem na conversa, nem na Minha
candidatura, nem na tela de reaproveitamento. A resposta é uma só e vale 12 meses (§5.6). Quem já
respondeu reabre o link e cai no fim, com as respostas e um botão. Precisa corrigir? "Fale com a
pessoa do IEL que mandou este link" — está em "Seus dados", na Minha candidatura. O reducer continua
aceitando a substituição (`answer-fit-questionnaire` é idempotente por candidatura), porque é o
IEL quem a faria.

## A frase e a régua

O instrumento não muda: mesmas 52 frases, mesma escala 1–5, mesma aderência. A frase na tela é o
`texto` da planilha do cliente, palavra por palavra — as reescritas `cena` e `textoSimples`
continuam em `instrumento.ts`, sem tela, desde 20/09/2026 (pedido do dono do produto). A
analista continua lendo "Discordo muito … Concordo muito" (`ESCALA_CONCORDANCIA`); o candidato
responde sobre si, e a régua diz isso (`ROTULOS_DA_REGUA.candidato`). Os valores são os mesmos.

**Acessibilidade.** A régua é um `radiogroup` do shadcn: setas movem, Espaço escolhe, Enter
confirma. O leitor de tela anuncia "Sou eu, 5 de 5". Nada só por cor: a palavra está escrita em
cada degrau. `h1` por tela com o foco levado até ele; erro de frase faltando em `role="alert"`.

## Reaproveitamento: a resposta é da pessoa

`perguntasQueFaltam` é a fonte das frases, e o contador conta o que falta. Três situações, nenhuma
silenciosa — mas cada uma numa linha só:

| Situação                                      | O que a tela faz                                                                                                                            |
| --------------------------------------------- | ------------------------------------------------------------------------------------------------------------------------------------------- |
| **Nada a perguntar** (`reuso.nadaAPerguntar`) | Tela própria, "Você já respondeu isto": uma linha, o aceite curto (a primeira linha diz o que vai ser usado) e **só** o botão de confirmar. |
| **Parcial** (`reuso.reaproveitadas > 0`)      | Uma linha na abertura: "3 já valem de uma vaga anterior; faltam 7". O questionário pergunta só as 7, e o contador diz "de 7".               |
| **Vencido** (`reuso.vencidas > 0`)            | As frases todas voltam, sem cartão explicando: a pessoa responde 10 e pronto.                                                               |

**A confirmação é dela.** `reuse-fit-answers` grava a versão do aceite vigente
(`versaoDoAceiteVigente()`). As versões `2026-09-22` e `2026-09-23` permitem o reuso
(`VERSOES_DE_ACEITE_QUE_PERMITEM_REUSO`); a anterior não.

## A porta para a conversa

A [conversa guiada](../../app/apps/dashboard/components/iel-demo/chat/conversa-candidato.tsx) existe
para quem tem dificuldade com formulário. A abertura oferece "Prefere responder conversando?" como
um link de uma linha no rodapé — não um cartão, para não competir com o aceite.

## Fechar e voltar

O que já foi respondido fica no **navegador da própria pessoa** (`shared/use-rascunho.ts`), com a
versão do aceite e a lista de frases daquela vaga gravadas junto: rascunho de outro texto de aceite
ou de outra lista de frases é descartado. Ela fecha na frase 4, volta depois e continua na 4 — **em
silêncio**, sem aviso. O rascunho some no envio. Rascunho não é resposta: o reducer só recebe o
questionário completo, com o aceite registrado.

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
- **Zero texto de bastidor.** Nada de versão do texto, "demonstração", "frase original", ids de
  frase ou explicação de método na tela de quem responde. É doc interna, não tela.
- **Celular primeiro**: 390×844 sem rolagem horizontal, alvos de 48px (72px nos degraus da
  régua), corpo de 15px; `h1` por passo, com o foco levado até ele a cada troca de tela.

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
- 2026-09-20 — cena na primeira pessoa e régua de um toque: a frase vira `cena` em título grande,
  com "ver a frase original" a um toque; as cinco bolinhas viram a régua "Nada a ver comigo … Sou
  eu", que seleciona e avança; a devolutiva pessoal entra no "Pronto!", acima de "O que acontece
  agora". Instrumento, escala e aderência intactos.
- 2026-09-23 — enxugamento pedido pelo dono do produto: aceite curto de três linhas com o texto
  inteiro recolhido (versão `2026-09-23`), abertura de uma linha, frases sem frase original nem
  contadores extras, fim com "Suas respostas" em vocabulário de escala no lugar da devolutiva
  pessoal, um botão só, e **nenhum "responder de novo"** — a resposta é uma só e vale 12 meses;
  corrigir é pelo IEL. Zero texto de bastidor. Abertura: de 401 para 129 palavras.
- 2026-09-20 — **a frase e o tópico do cliente, sem edição.** O dono do produto: _"Não muda as
  perguntas, nem o sentido dela, nem a categoria, por favor. Ela foi feita com rigor; mudar é meio
  paia."_ O título da tela passa a ser o `texto` da planilha (`04-perguntas-empresa.xlsx`), e
  "Suas respostas" também; `cena` e `textoSimples` ficaram no código sem uso de tela. Os temas
  levam o nome do tópico da planilha ("Orientação para resultados", não "Jeito de entregar") e
  voltam a ser 11: "Expectativas futuras" deixa de estar dentro de "Adaptação a mudanças e
  carreira". Frase acima de 120 caracteres desce um degrau (20px) para caber a 390 px.
- 2026-09-20 — **atalho da equipe: só com sessão da analista.** Quem abre o link com o cookie
  da Central (`analistaLogada()`, só o cookie — a porta aberta sem senha não conta) vê, no rodapé,
  "Equipe do IEL · Abrir no Mind RH", que leva ao perfil da pessoa (`/talentos/<talentId>`; sem
  talento, à vaga). Sem cookie o DOM não tem nem um wrapper. Vale para `/fit`, `/conversa`, Minha
  candidatura e "Como está sendo?".
- 2026-09-20 — o número de frases passa a ser **uma por competência que a empresa escolheu** (R11,
  de 3 a 11), menos o que a pessoa já respondeu dentro da validade. As mensagens de convite e
  lembrete deixam de dizer "10 frases" e montam o número a partir da candidatura.
