# Consulta ao colaborador

**Rota:** `/consulta/[token]`
**Componente:** `apps/dashboard/components/iel-demo/companies/culture-invite-screen.tsx`
**Regra:** `apps/dashboard/features/iel-demo/analysis/culture-invites.ts`
**Persona:** quem trabalha na empresa e recebeu o link, sem login
**Última atualização:** 2026-09-23

## O que a tela faz

Responde uma pergunta — "como é trabalhar aqui?" — pelas frases do bloco daquele convite
(amostragem em matriz sobre as 52 do instrumento), uma frase por tela. São até 16; ficam menos
quando a empresa pede menos de 11 competências (R11) — o rodízio é o mesmo, o bloco é que encolhe —,
e o bloco é calculado na abertura do link, de modo que quem já respondeu não tem o conteúdo alterado
depois. É o que forma o perfil
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
questionário não abre. O texto é o de `CULTURE_CONSENT_TEXT` (`analysis/culture-invites.ts`),
versionado (`CULTURE_CONSENT_VERSION`, hoje `2026-09-23`); a versão vai gravada junto da resposta e
**não aparece na tela**. O que a pessoa lê é o **aceite curto** (`AceiteCurto`): "Antes de
responder", três linhas (`CULTURE_CONSENT_RESUMO` — o que responde e para quê · quem vê · por
quanto tempo), a caixa "Li e aceito" e o botão; o texto inteiro fica atrás de "Ler o texto
completo".

## O que a tela não mostra

- **Ninguém mais.** Não há lista de colegas, contagem de quem já respondeu nem média parcial. Quem
  responde sobre o próprio ambiente não pode ver — nem ser visto por — os outros respondentes: a
  empresa recebe a média, nunca "fulano respondeu isto" (PRODUTO.md §5).
- **Nem o próprio e-mail.** `getInviteByToken` devolve só a empresa, o prazo e a situação. Um link
  vazado não vira vazamento de dado pessoal.
- **Nenhuma leitura sobre o lugar ou sobre a pessoa.** O fim devolve o que ela respondeu, frase a
  frase; a devolutiva pessoal saiu (ver abaixo).

## O que aparece

Três telas, poucas palavras (pedido do dono do produto, 20/09/2026):

- **Abertura.** "Como é trabalhar aqui?", uma linha ("A equipe do IEL que atende a Colatte quer a
  opinião de quem vive o dia a dia daí. Não existe resposta certa."), as etiquetas "16 frases · uns
  5 minutos · sem cadastro", o aceite curto — a segunda linha é o anonimato: "Ninguém vê a sua
  resposta sozinha: nem a empresa, nem a chefia, nem o IEL. Só a média." — e, no rodapé, o link
  "Prefere responder conversando?".
- **As 16 frases do bloco, como o cliente as escreveu**, uma por tela: "8 de 16" pequeno no topo
  com a barra, o `texto` da planilha em título grande, sem edição, "O quanto isso é assim aí?", a **régua de um toque** do colaborador
  ("Não é assim aqui · Pouco · Depende · Quase sempre · É bem assim aqui"), em azul — é o lado da
  empresa que a resposta forma —, "Próxima" e um "Voltar" discreto.
- **Fim.** "Obrigado.", uma linha (a resposta foi registrada e entra numa média com a da equipe;
  este link não abre outra vez) e o bloco **"Suas respostas"** (`shared/suas-respostas.tsx`): a
  frase do cliente e, à direita, o grau no vocabulário da escala (_Discordo muito … Concordo muito_), por tema.
  Rodapé: "É o que você respondeu. Entra numa média com a equipe; ninguém vê a sua sozinha." Sem
  botão: o link é de uso único.

## A frase e a régua

Mesma decisão do [questionário do candidato](17-questionario-do-candidato.md#a-frase-e-a-régua):
o instrumento não muda — mesmas 52 frases, mesma escala, mesma média — e a tela mostra o `texto`
da planilha do cliente, sem edição (`cena` e `textoSimples` ficaram no código, sem tela). O que é
próprio daqui: a régua do colaborador
(`ROTULOS_DA_REGUA.colaborador`) fala do lugar, não da pessoa, e preenche em azul. Os valores são
os mesmos que a analista lê como "Discordo muito … Concordo muito".

A marca da empresa entraria na abertura, ao lado de quem pediu; `Company` não tem campo de logo, e
sem campo nada foi inventado.

## O anonimato

A promessa de anonimato é o que decide se a resposta é honesta: a pessoa está dizendo como é
trabalhar na empresa dela, e a chefia pode estar do lado. Era um cartão próprio; agora é a segunda
das três linhas do aceite, onde a pessoa lê antes de marcar a caixa. O "nem o IEL" é verdade e está
na matriz de acesso: o analista vê o agregado por tema, nunca a resposta individual (§5.1).

## A porta para a conversa

A [conversa guiada](../../app/apps/dashboard/components/iel-demo/chat/conversa-colaborador.tsx)
existe para quem tem dificuldade com formulário. A abertura oferece "Prefere responder
conversando?" como um link de uma linha no rodapé.

## Fechar e voltar

São 16 frases no intervalo do turno: interrupção é o caso comum. O que já foi respondido fica no
**navegador da própria pessoa** (`shared/use-rascunho.ts`), preso à versão do aceite e ao bloco
daquele convite; ela fecha na frase 7, volta depois e continua na 7, em silêncio. O rascunho some
no envio. A retomada não olha o status do convite: a base da demonstração chega do navegador depois
da primeira renderização, e um convite reenviado ao vivo ainda parece vencido nesse instante.

**Rascunho não é resposta.** Nada pela metade chega ao estado da demonstração.

## De onde vêm os dados hoje

- `getInviteByToken`, em `state/selectors.ts`, sobre `fixtures/culture-invites.ts`.
- As frases vêm de `blocoDoConvite` (`analysis/instrumento.ts`); o aceite, de `CULTURE_CONSENT_TEXT`
  e `CULTURE_CONSENT_RESUMO`.

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
- 2026-09-23 — enxugamento pedido pelo dono do produto: aceite curto de três linhas com o texto
  inteiro recolhido (`CULTURE_CONSENT_TEXT` vira constante; versão `2026-09-23`), abertura de uma
  linha com o anonimato dentro do aceite, frases sem frase original nem contadores extras, fim com
  "Suas respostas" em vocabulário de escala no lugar da devolutiva pessoal. Zero texto de bastidor.
  Abertura: de 235 para 101 palavras.
- 2026-09-20 — **a frase e o tópico do cliente, sem edição**, como no
  [questionário do candidato](17-questionario-do-candidato.md#a-frase-e-a-régua): o título é o
  `texto` da planilha, "Suas respostas" idem; `cena` e `textoSimples` ficaram no código sem uso
  de tela; temas com o nome do tópico do cliente, e 11 deles.
- 2026-09-20 — **atalho da equipe: só com sessão da analista.** Com o cookie da Central
  (`analistaLogada()`), o rodapé mostra "Equipe do IEL · Abrir no Mind RH", que leva à empresa do
  convite (`/empresas/<companyId>`); vale na tela em passos e na conversa. Sem cookie, nada no DOM.

- 2026-09-20 — o bloco passa a sair filtrado pelas competências que a empresa escolheu (R11): com 8
  das 11, o colaborador responde menos frases, sobre os temas que a empresa quer medir.
