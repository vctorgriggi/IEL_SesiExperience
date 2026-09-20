# Mapa de Cultura

**Rota:** aba **Mapa de cultura** em `/iel/empresas/[companyId]` — o link direto é
`/iel/empresas/[companyId]?aba=mapa`, e `&vaga=<jobId>` abre o escopo já nos inscritos daquela vaga
**Rota legada:** `/iel/mapa-de-cultura` **redireciona** para a aba (link antigo não dá 404)
**Componentes:**
`apps/dashboard/components/iel-demo/mapa-cultural/mapa-da-empresa.tsx`,
`mapa-cultural/plano-cultural.tsx`,
`mapa-cultural/lista-entidades-mapa.tsx`,
`mapa-cultural/detalhe-ponto-cultural.tsx`,
`mapa-cultural/faixa-badge.tsx`
**Gráfico:** `packages/charts/src/quadrant-chart.tsx`
**Regra:** `apps/dashboard/features/iel-demo/analysis/mapa-cultural.ts` (projeção,
faixas e piso) e `analysis/adherence.ts` (o percentual)
**Persona:** Analista IEL
**Última atualização:** 2026-09-19

## O que a tela faz

Responde, dentro da empresa, uma pergunta concreta: **onde esta empresa está e quem na base combina
com esta cultura**. A empresa ocupa o centro do plano; cada pessoa é desenhada a uma distância que
**é** a aderência dela.

Era tela solta no menu lateral, aberta na base inteira, com um seletor de empresa dentro dela. O
fundamento da mudança é a fala do cliente: _"uma coisa do fit cultural é sobre a cultura da empresa.
Não é sobre a vaga"_ (00:31:38). O mapa sempre mediu encaixe contra **uma** cultura — então ele mora
onde a cultura mora. Sem empresa de referência não há contra quem medir, e o modo "Panorama da
Base", que desenhava posições absolutas sem referência, saiu junto: ele era paisagem, não decisão.

Não é um segundo modelo cultural. O produto já descreve cultura nos temas do instrumento
(`analysis/instrumento.ts` e `analysis/culture.ts`); o mapa só lê essas respostas.

## O plano é um alvo

A empresa de referência ocupa o centro. Cada pessoa é desenhada num raio derivado da própria
aderência: **quanto mais perto, maior o percentual**. O ângulo guarda a direção em que ela difere,
preservada da posição absoluta; empatados no mesmo ponto, o ângulo vem do identificador, para que
dois perfis idênticos não se sobreponham.

Anéis tracejados em **35%**, **65%** e **85%** dão escala ao raio — sem eles a distância seria
grandeza sem legenda.

Ficam de fora neste modo, porque descrevem posição absoluta e passariam a mentir: os quadrantes, os
rótulos dos eixos, as linhas centrais e o ponto da voz da equipe.

**Por que o alvo existe.** A versão anterior desenhava a posição absoluta dos dois lados e deixava a
distância cair onde caísse. Medido na base, metade dos pares aparecia invertida — alguém com 88% mais
longe da empresa do que alguém com 81%. A causa não era ajustável: o plano tem duas dimensões e a
aderência mede temas ponderados, e projetar muitos em dois destrói a ordem. Derivar a posição da
mesma escala ordinal baixava a inversão para 44%; restringir aos temas que os dois lados responderam
chegava a 35%. Nenhuma das duas resolvia, então o raio passou a **ser** a aderência.

## Escopo: quem se inscreveu ou toda a base

Duas abas no cabeçalho do cartão, e uma escolha de vaga junto da primeira:

- **Quem se inscreveu** — as pessoas candidatas às vagas desta empresa. A vaga é opcional e só
  delimita quem conta como inscrito; ela só aparece neste escopo, porque em "Toda a base" ficaria
  visível e editável sem mudar nada na tela.
- **Toda a base** — a base curada inteira, para a conversa de "quem mais poderia servir aqui".

O contador de cada aba conta **o que o mapa desenha**, não quantas candidaturas existem: uma vaga
com 92 inscritos aparece com 27 se só 27 responderam. Contar 92 e desenhar 27 faria a tela prometer
o que não mostra. A linha ao lado diz isso com todas as letras ("27 de 92 inscritos responderam").

## As regiões, recolhidas

As quatro regiões do plano continuam descritas, agora atrás de "Onde esta empresa está no mapa":
quem abre a aba quer saber quem combina, não a taxonomia. Clicar numa região recorta o mapa; a
região da própria empresa vem marcada.

| Eixo        | −1                                      | +1                                           |
| ----------- | --------------------------------------- | -------------------------------------------- |
| `x` (foco)  | Pessoas — apoio, convívio, formação     | Entrega — meta, resultado, autonomia cobrada |
| `y` (ritmo) | Estrutura — processo, rotina previsível | Flexibilidade — variação, decisão no momento |

As quatro regiões: **Colaborativa** (pessoas + flexibilidade), **Inovadora** (entrega +
flexibilidade), **Resultados** (entrega + estrutura), **Estruturada** (pessoas + estrutura). Perto do
centro, o rótulo é **Sem predominância** — a tela não força quadrante em quem não puxa para nenhum.

Os quatro nomes descrevem **ambiente de trabalho**. "Estruturada" é uma frase sobre como o trabalho
acontece, nunca sobre quem a pessoa é.

A posição sai de `CONTRIBUICAO_POR_TEMA`: cada resposta tem uma contribuição fixa `(x, y)`, e o
ponto é a média dos temas respondidos. Tema sem resposta fica de fora — zero é o centro do plano, e
"não respondeu" não é "fica no meio".

## O percentual de aderência

O briefing original pedia para não produzir nota global de fit. O cliente revogou isso em reunião —
"o fit tem que ter no mínimo 35% de aderência para ser compatível" (00:20:19), registrado em
`PRODUTO.md` §6. O percentual existe, com as condições que vieram junto:

- O rótulo é sempre **aderência**, nunca "chance de sucesso".
- O **denominador aparece**: "2 de 10 temas". 80% sobre dois temas não é 80% sobre dez.
- A conta é **explicável até o tema**, exigência de LGPD art. 20 §1º.
- O corte de 35% **marca**, não elimina. Quem fica abaixo continua visível e clicável.

Quem calcula é `analysis/adherence.ts`, o mesmo motor da mesa de seleção — o mapa não tem cálculo
próprio, para que a mesma pessoa não apareça com dois percentuais diferentes em duas telas. A ponte é
`getTalentCompanyAdherence`, que responde "esta pessoa, nesta empresa" sem exigir candidatura, ao
contrário de `getAdherence`, que é por candidatura.

A **faixa nomeada** (Muito próximo / Próximo / Alguma distância / Distante) é lida do próprio
percentual em `faixaDeAderencia`, com pisos em 85, 65 e 35. Antes ela vinha da distância no plano
enquanto o número vinha de outra conta, e a lista chegou a exibir "44% · Muito próximo" ao lado de
"44% · Alguma distância".

## Ranking e piso de evidência

A lista é ordenada por aderência e numerada. O ranking existe **só dentro do escopo desta empresa** —
ordenar a base inteira seria o "ranking universal de melhores pessoas" que o briefing veda e que a
reunião manteve fora. É também por isso que o mapa mora na empresa: fora dela, o ranking não teria
escopo.

Empate desempata por quantidade de temas comparados: 100% sobre quatro temas e 100% sobre um são o
mesmo número apoiado em evidência muito diferente.

Abaixo de `MINIMO_DE_EIXOS_PARA_RANQUEAR` (2) não há posição atribuída. Um tema em comum vira 0 ou
100 e nada entre os dois — o número existe, mas não distingue ninguém. Quem fica abaixo do piso
aparece agrupado sob "Sem base suficiente para posição", **sem número de posição e sem faixa**, mas
com o percentual visível, no mapa e clicável. Não ranquear não é descartar.

## O que aparece

- **Plano** com a empresa no centro e as pessoas em volta; passar o mouse liga empresa e pessoa por
  uma linha com o percentual escrito nela — comprimento sugere quantidade, e quem lê precisa ver o
  valor, não deduzir do tamanho.
- **Legenda**: círculo para pessoa, quadrado para a empresa, e a escala dos anéis dita por escrito.
- **Busca por nome** e **lista lateral** com posição, percentual, faixa, denominador e cultura
  predominante; selecionar na lista abre o detalhe e destaca no plano.
- **Detalhe do ponto**: o percentual grande com o denominador, a frase que nomeia a tendência de cada
  lado, a recomendação da faixa e os temas que divergiram com a resposta literal dos dois lados, mais
  o atalho para o perfil da pessoa (com a vaga no contexto, quando há vaga escolhida).
- **Rodapé com os limites**, por escrito: o piso de evidência, o corte que marca sem eliminar, a
  ausência que nunca vira zero e a frase de que o mapa apoia a decisão humana e não descarta
  ninguém.
- **Empresa sem perfil fechado** não vira ponto no centro: a aba diz que a consulta ainda não
  sustenta o perfil e aponta a aba Colaboradores, onde se convida e se cobra quem falta.

## De onde vêm os dados hoje

- Empresa: `getCompanyCultureAnswers` e `perfilDaEmpresa`, que separam a versão declarada
  (gestão/RH) da versão da equipe, esta só quando a consulta alcança `MIN_TEAM_RESPONSES`. O ponto
  da empresa é montado na própria aba, e não lido de `getCultureMapPoints`: varrer as 2.500 empresas
  da carteira para achar uma só seria trabalho jogado fora a cada render.
- Pessoas: `getCultureMapPoints(state, 'talentos')` sobre `fixtures/preferencias-culturais.ts` mais
  as respostas geradas em `fixtures/generated.ts`.
- Composição: `getCultureFit` e `getTalentCompanyAdherence`, em `state/selectors.ts`, memorizados
  por `state`.

## Ações do usuário

- Trocar escopo, escolher vaga, filtrar por região, buscar, selecionar ponto — estado local da tela,
  não estado de domínio.
- Nenhuma ação de reducer: o mapa é leitura sobre dados que já existem.

## Backend futuro

- As respostas do talento passam a ser coletadas no cadastro ou no atendimento do IEL, com revisão
  da própria pessoa antes de salvar, e ficam versionadas.
- O cálculo permanece determinístico e **no servidor**, com a tabela de contribuição e os pesos
  versionados: um encaminhamento antigo precisa continuar explicável pela regra que valia na época.
- A IA entra, no máximo, como apoio de preenchimento — rascunho do perfil a partir de texto que a
  pessoa ou a empresa já escreveu, sempre pendente de confirmação humana, no mesmo contrato de
  `CultureSuggestion`. A aderência nunca é calculada por modelo.
- Consulta à equipe agregada no servidor, com o mínimo de respostas aplicado antes de devolver
  qualquer resultado.

## Regras e limites

- **Ambiente de trabalho, nunca pessoa.** Nada aqui é personalidade, perfil psicológico, saúde ou
  dado sensível.
- **Determinístico e explicável.** Tabela pública, pesos declarados, faixa nomeada, leitura por tema
  e denominador à vista em cada percentual.
- **Nenhum estado depende só de cor.** "Abaixo do corte" e "sem base suficiente" são ditos por
  escrito; a forma (círculo/quadrado) repete o que a cor diz.
- **O ranking é por empresa**, nunca entre vagas nem em abstrato, e não recomenda descarte.
- **Equipe anônima e agregada**, com `MIN_TEAM_RESPONSES` respeitado.
- **A aba é da analista.** É leitura sobre a base de pessoas do IEL, então não aparece para o perfil
  de gestor (PRODUTO.md §5.1).
- Quem não respondeu fica fora do mapa.

## Ligações

Vem de: [Contexto da empresa](10-contexto-da-empresa.md), de que é uma aba, e da
[Mesa de seleção](04-mesa-de-selecao.md), pelo botão "Mapa da empresa", que chega com a vaga no
escopo.
Entra em: [Perfil do talento](08-perfil-do-talento.md).

## Histórico

- 2026-09-19 — criada junto com a feature.
- 2026-09-19 — percentual de aderência, corte de 35%, ranking por empresa e piso de dois eixos.
- 2026-09-19 — integração com a interface Mind RH (shadcn) e adoção de `analysis/adherence.ts` como
  motor único; o cálculo próprio do mapa foi removido.
- 2026-09-19 — no modo Empresa & Talentos, a distância até a empresa passa a ser a aderência.
- 2026-09-19 — deixa de ser tela do menu e vira **aba da empresa**, com escopo por inscritos ou base
  inteira. O modo "Panorama da Base" saiu (sem referência não há o que medir), as regiões passaram a
  abrir recolhidas e a rota antiga virou redirecionamento.
