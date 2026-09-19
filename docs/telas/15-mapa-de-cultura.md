# Mapa de Cultura

**Rota:** `/iel/mapa-de-cultura` (panorama) e bloco dentro de
`/iel/talentos/[talentId]?vaga=<jobId>` (resultado talento × vaga)
**Componentes:**
`apps/dashboard/components/iel-demo/mapa-cultural/panorama-cultural.tsx`,
`mapa-cultural/plano-cultural.tsx`,
`mapa-cultural/lista-entidades-mapa.tsx`,
`mapa-cultural/detalhe-ponto-cultural.tsx`,
`mapa-cultural/encaixe-cultural.tsx`,
`mapa-cultural/faixa-badge.tsx`
**Gráfico:** `packages/charts/src/quadrant-chart.tsx`
**Regra:** `apps/dashboard/features/iel-demo/analysis/mapa-cultural.ts` (projeção,
faixas e piso) e `analysis/adherence.ts` (o percentual)
**Persona:** Analista IEL
**Última atualização:** 2026-09-19

## O que a tela faz

Posiciona talentos e empresas a partir das respostas que os dois lados já deram nos cinco eixos de
ambiente de trabalho. Serve para duas coisas, e o modo escolhido decide qual: medir a aderência de
cada pessoa a uma empresa, ou enxergar a paisagem cultural da base.

Não é um segundo modelo cultural. O produto já descreve cultura em cinco eixos de condição de
trabalho observável (`analysis/fit-axes.ts` e `analysis/culture.ts`); o mapa só lê essas respostas.

## Os dois modos do plano

O mesmo desenho responde perguntas diferentes, e o que a distância significa muda junto.

### Empresa & Talentos — o plano é um alvo

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
aderência mede cinco eixos ponderados, e projetar cinco em duas destrói a ordem. Derivar a posição da
mesma escala ordinal baixava a inversão para 44%; restringir aos eixos que os dois lados responderam
chegava a 35%. Nenhuma das duas resolvia, então o raio passou a **ser** a aderência.

### Panorama da Base — o plano é um mapa

Sem empresa de referência não há contra quem medir. Cada ponto volta para a posição absoluta que as
próprias respostas produzem, e os quadrantes voltam a valer.

| Eixo        | −1                                      | +1                                           |
| ----------- | --------------------------------------- | -------------------------------------------- |
| `x` (foco)  | Pessoas — apoio, convívio, formação     | Entrega — meta, resultado, autonomia cobrada |
| `y` (ritmo) | Estrutura — processo, rotina previsível | Flexibilidade — variação, decisão no momento |

As quatro regiões: **Colaborativa** (pessoas + flexibilidade), **Inovadora** (entrega +
flexibilidade), **Resultados** (entrega + estrutura), **Estruturada** (pessoas + estrutura). Perto do
centro, o rótulo é **Sem predominância** — a tela não força quadrante em quem não puxa para nenhum.

Os quatro nomes descrevem **ambiente de trabalho**. "Estruturada" é uma frase sobre como o trabalho
acontece, nunca sobre quem a pessoa é.

A posição sai de `CONTRIBUICAO_POR_ALTERNATIVA`: cada alternativa tem uma contribuição fixa `(x, y)`,
e o ponto é a média dos eixos respondidos. Eixo sem resposta fica de fora — zero é o centro do plano,
e "não respondeu" não é "fica no meio".

## O percentual de aderência

O briefing original pedia para não produzir nota global de fit. O cliente revogou isso em reunião —
"o fit tem que ter no mínimo 35% de aderência para ser compatível" (00:20:19), registrado em
`PRODUTO.md` §6. O percentual existe, com as condições que vieram junto:

- O rótulo é sempre **aderência**, nunca "chance de sucesso".
- O **denominador aparece**: "2 de 5 eixos". 80% sobre dois eixos não é 80% sobre cinco.
- A conta é **explicável até o eixo**, exigência de LGPD art. 20 §1º.
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

No modo Empresa & Talentos a lista é ordenada por aderência e numerada. O ranking existe **só dentro
do escopo de uma empresa** — ordenar a base inteira seria o "ranking universal de melhores pessoas"
que o briefing veda e que a reunião manteve fora.

Empate desempata por quantidade de eixos comparados: 100% sobre quatro eixos e 100% sobre um são o
mesmo número apoiado em evidência muito diferente.

Abaixo de `MINIMO_DE_EIXOS_PARA_RANQUEAR` (2) não há posição atribuída. Um eixo em comum vira 0 ou
100 e nada entre os dois — o número existe, mas não distingue ninguém. Quem fica abaixo do piso
aparece agrupado sob "Sem base suficiente para posição", **sem número de posição e sem faixa**, mas
com o percentual visível, no mapa e clicável. Não ranquear não é descartar.

## O que aparece — resultado talento × vaga

- **Faixa de aderência** no cabeçalho do cartão.
- **Plano** com o ponto da pessoa e o da empresa.
- **Cultura predominante** de cada lado.
- **Onde convergem** e **Onde vale alinhar**, eixo a eixo, com as duas alternativas escritas.
- **Divergência gestão × equipe**, quando existe: o encaixe recalculado contra o ambiente que a
  equipe descreve, porque é esse que a pessoa encontra no dia a dia.
- **Aviso** de que o mapa apoia a decisão humana e não descarta ninguém.
- Quando falta o questionário de um dos lados, a tela diz isso e não desenha ponto nenhum.

## O que aparece — panorama

- **Alternador de modo** no cabeçalho da casca: Empresa & Talentos ou Panorama da Base.
- **Empresa de referência** e, só quando o escopo é "Só Inscritos", a **vaga** que delimita quem
  conta como inscrito.
- **Plano** conforme o modo; passar o mouse liga empresa e pessoa por uma linha com o percentual
  escrito nela — comprimento sugere quantidade, e quem lê precisa ver o valor, não deduzir do
  tamanho.
- **Legenda**: círculo para talento, quadrado para empresa, círculo vazado para a versão da equipe.
- **Busca por nome** e **lista lateral** com posição, percentual, faixa, denominador e cultura
  predominante; selecionar na lista abre o detalhe e destaca no plano.
- **Detalhe do ponto**: o percentual grande com o denominador, a frase que nomeia a tendência de cada
  lado, a recomendação da faixa e os eixos que divergiram com a resposta literal dos dois lados.
- **Regiões do mapa** — o que cada uma descreve e quantos pontos estão nela.

## De onde vêm os dados hoje

- Empresa: `getCompanyCultureAnswers` e `getCompanyCultureProfile`, que separam a versão declarada
  (gestão/RH) da versão da equipe, esta só quando a consulta alcança `MIN_TEAM_RESPONSES`.
- Talento: `getTalentCultureAnswers`, sobre `fixtures/preferencias-culturais.ts` mais as respostas
  geradas em `fixtures/generated.ts`.
- Composição: `getCultureMapPoints`, `getCultureFit` e `getTalentCompanyAdherence`, em
  `state/selectors.ts`.

## Ações do usuário

- Alternar modo, filtrar, buscar, selecionar ponto — estado local da tela, não estado de domínio.
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
- **Determinístico e explicável.** Tabela pública, pesos declarados, faixa nomeada, leitura por eixo
  e denominador à vista em cada percentual.
- **Nenhum estado depende só de cor.** "Abaixo do corte" e "sem base suficiente" são ditos por
  escrito; a forma (círculo/quadrado) repete o que a cor diz.
- **O ranking é por empresa**, nunca entre vagas nem em abstrato, e não recomenda descarte.
- **Equipe anônima e agregada**, com `MIN_TEAM_RESPONSES` respeitado.
- Quem não respondeu fica fora do mapa.

## Ligações

Vem de: [Contexto da empresa](10-contexto-da-empresa.md) (respostas da empresa),
[Perfil do talento](08-perfil-do-talento.md) (bloco do resultado).

## Histórico

- 2026-09-19 — criada junto com a feature.
- 2026-09-19 — percentual de aderência, corte de 35%, ranking por empresa e piso de dois eixos.
- 2026-09-19 — integração com a interface Mind RH (shadcn) e adoção de `analysis/adherence.ts` como
  motor único; o cálculo próprio do mapa foi removido.
- 2026-09-19 — no modo Empresa & Talentos, a distância até a empresa passa a ser a aderência.
