# Mapa de Cultura

**Rota:** `/iel/mapa-de-cultura` (panorama) e bloco dentro de
`/iel/talentos/[talentId]?vaga=<jobId>` (resultado talento × vaga)
**Componentes:**
`apps/dashboard/components/iel-demo/mapa-cultural/panorama-cultural.tsx`,
`mapa-cultural/encaixe-cultural.tsx`,
`mapa-cultural/plano-cultural.tsx`
**Regra:** `apps/dashboard/features/iel-demo/analysis/mapa-cultural.ts`
**Persona:** Analista IEL
**Última atualização:** 2026-09-19

## O que a tela faz

Posiciona talentos e empresas no mesmo plano de duas dimensões, a partir das respostas que os dois
lados já deram nos cinco eixos de ambiente de trabalho. Serve para duas coisas: ver o encaixe de uma
pessoa com uma empresa e enxergar a paisagem cultural inteira da base, sem avaliação individual cara.

Não é um segundo modelo cultural. O produto já descreve cultura em cinco eixos de condição de
trabalho observável (`analysis/fit-axes.ts` e `analysis/culture.ts`); o mapa só projeta essas
respostas em duas dimensões.

## O plano

| Eixo        | −1                                      | +1                                           |
| ----------- | --------------------------------------- | -------------------------------------------- |
| `x` (foco)  | Pessoas — apoio, convívio, formação     | Entrega — meta, resultado, autonomia cobrada |
| `y` (ritmo) | Estrutura — processo, rotina previsível | Flexibilidade — variação, decisão no momento |

As quatro regiões: **Colaborativa** (pessoas + flexibilidade), **Inovadora** (entrega +
flexibilidade), **Resultados** (entrega + estrutura), **Estruturada** (pessoas + estrutura). Perto do
centro, o rótulo é **Sem predominância** — a tela não força quadrante em quem não puxa para nenhum.

Os quatro nomes descrevem **ambiente de trabalho**. "Estruturada" é uma frase sobre como o trabalho
acontece, nunca sobre quem a pessoa é.

## Como a posição é calculada

1. Cada alternativa do questionário tem uma contribuição fixa `(x, y)`, declarada em
   `CONTRIBUICAO_POR_ALTERNATIVA`. É a regra inteira: com a tabela em mãos, qualquer ponto se refaz
   à mão.
2. A posição é a **média** dos eixos respondidos. Eixo sem resposta fica de fora — zero é o centro
   do plano, e "não respondeu" não é "fica no meio".
3. A região sai do quadrante, com zona morta de `0,2` em volta do centro.
4. O encaixe é a distância euclidiana entre os dois pontos, traduzida em faixa: **Muito próximo**
   (≤ 0,5), **Próximo** (≤ 1,0), **Alguma distância** (≤ 1,6), **Distante** (> 1,6).

**Não existe nota, percentual nem ranking.** A faixa vem acompanhada da leitura eixo a eixo, e é ela
que diz o que fazer: a distância diz "longe", só o eixo diz o que perguntar.

## O que aparece — resultado talento × vaga

- **Faixa de encaixe** no cabeçalho, com a frase correspondente.
- **Plano** com o ponto da pessoa e o da empresa.
- **Cultura predominante** de cada lado.
- **Onde convergem** e **Onde vale alinhar**, eixo a eixo, com as duas alternativas escritas.
- **Divergência gestão × equipe**, quando existe: o encaixe recalculado contra o ambiente que a
  equipe descreve, porque é esse que a pessoa encontra no dia a dia.
- **Aviso** de que o mapa apoia a decisão humana e não descarta ninguém.
- Quando falta o questionário de um dos lados, a tela diz isso e não desenha ponto nenhum.

## O que aparece — panorama

- **Filtro**: talentos e empresas, só talentos, só empresas.
- **Plano** com todos os pontos; clicar destaca e nomeia o ponto.
- **Legenda**: círculo para talento, quadrado para empresa, círculo vazado para a versão da equipe.
- **Busca por nome** e **lista lateral** com cultura predominante, eixos respondidos e eixos
  divergentes; selecionar na lista destaca no plano e vice-versa.
- **Contagem** de pontos no mapa e de cadastros ainda sem resposta.
- **Regiões do mapa** — o que cada uma descreve e quantos pontos estão nela.

## De onde vêm os dados hoje

- Empresa: `getCompanyCultureAnswers`, que lê `getCultureReading` e separa a versão declarada
  (gestão/RH) da versão da equipe, esta só quando a consulta alcança `MIN_TEAM_RESPONSES`.
- Talento: `getTalentCultureAnswers`, sobre `fixtures/preferencias-culturais.ts` mais as respostas
  geradas em `fixtures/generated.ts`.
- Composição: `getCultureMapPoints`, `getCultureMapGaps` e `getCultureFit`, em `state/selectors.ts`.

## Ações do usuário

- Filtrar, buscar e destacar — estado local da tela, não estado de domínio.
- Nenhuma ação de reducer: o mapa é leitura sobre dados que já existem.

## Backend futuro

- As respostas do talento passam a ser coletadas no cadastro ou no atendimento do IEL, com revisão
  da própria pessoa antes de salvar, e ficam versionadas.
- O cálculo permanece determinístico e **no servidor**, com a tabela de contribuição versionada: um
  encaminhamento antigo precisa continuar explicável pela regra que valia na época.
- A IA entra, no máximo, como apoio de preenchimento — rascunho do perfil a partir de texto que a
  pessoa ou a empresa já escreveu, sempre pendente de confirmação humana, no mesmo contrato de
  `CultureSuggestion`. O encaixe nunca é calculado por modelo.
- Consulta à equipe agregada no servidor, com o mínimo de respostas aplicado antes de devolver
  qualquer resultado.

## Regras e limites

- **Ambiente de trabalho, nunca pessoa.** Nada aqui é personalidade, perfil psicológico, saúde ou
  dado sensível.
- **Determinístico e explicável.** Tabela pública, faixa nomeada, leitura por eixo e contagem de
  eixos que sustentam cada ponto.
- **Complementar.** O mapa não ordena candidatos, não recomenda descarte e não elimina ninguém.
- **Equipe anônima e agregada**, com `MIN_TEAM_RESPONSES` respeitado.
- Quem não respondeu fica fora do mapa e aparece na contagem de cadastros sem resposta.

## Ligações

Vem de: [Contexto da empresa](10-contexto-da-empresa.md) (respostas da empresa),
[Perfil do talento](08-perfil-do-talento.md) (bloco do resultado).

## Histórico

- 2026-09-19 — criada junto com a feature.
