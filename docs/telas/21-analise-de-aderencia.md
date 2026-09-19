# Análise de aderência

**Rota:** `/iel/analise-de-aderencia` (a vaga vem em `?vaga=`)
**Componente:** `apps/dashboard/components/iel-demo/aderencia/tela-de-aderencia.tsx`
**Persona:** Analista IEL, Gestor
**Última atualização:** 2026-09-19

## O que a tela faz

Tela própria no menu lateral, e não um pedaço da vaga: mostra a aderência de uma vaga em duas
leituras da mesma medida, numa página só: todas as pessoas da
vaga, ordenadas, e uma pessoa por vez com os cinco pontos do dia a dia abertos. A mesa de seleção
responde "o que faço com esta pessoa"; esta tela responde antes disso — "como está a vaga, e por que
esta pessoa está nesta posição".

Sem abas: a pessoa fica em cima e o ranking da vaga logo abaixo, na mesma rolagem. Aba obrigaria a
guardar o número de uma leitura na cabeça para comparar com o da outra. O ranking é também um
seletor — clicar numa linha troca quem está em cima.

## O que aparece

Na ordem da tela:

- **Seletor de vaga** — o primeiro campo, porque quem chega pelo menu ainda não escolheu processo
  nenhum. Tem busca por título da vaga e por empresa. Quem vem da mesa de seleção chega com a vaga
  já preenchida por `?vaga=` e não escolhe nada. Trocar de vaga volta o foco para a primeira pessoa
  do ranking.
- **Resumo da vaga em uma linha** — quantas pessoas, quantas acima do mínimo de 35%, a média de quem
  respondeu e quantas estão sem resposta.
- **Seletor de pessoa** — quem está em foco, com busca por nome, cidade e headline, percentual ao
  lado de cada nome, e navegação "anterior / próxima" pelo ranking ("3 de 90 pessoas").
- **Pessoa em foco** — posição, nome e "Candidatura para <vaga> · <empresa>", com o atalho "Ver
  leitura completa". Começa na primeira do ranking.
- **O número dela** — o percentual em corpo grande com a frase que o interpreta, e as etiquetas de
  cobertura ("3 de 5 pontos medidos"), percentual técnico e posição na vaga. Abaixo do mínimo o
  número sai no laranja de atenção (`--brand-accent`).
- **Radar dos cinco pontos** — o polígono da empresa e o da pessoa sobre a mesma escala de 1 a 3,
  com legenda dizendo que a escala são as três alternativas do questionário, não uma nota. Ponto sem
  um dos lados abre o polígono em vez de ser desenhado como mínimo, e um ponto medido entre dois
  pontos sem medida aparece como marca solta. Em volta do polígono o nome do ponto vai curto
  (`AXIS_SHORT_LABEL`), porque ali o espaço é do desenho; o nome inteiro está na lista ao lado.
- **Os cinco pontos, um a um** — a aderência de cada ponto, o peso declarado pela empresa, o trilho
  com o corte de 35% marcado e, embaixo, os dois lados em números ("Empresa: média 1,4 de 3 ·
  Helena: opção 1 de 3"). Ponto sem um dos lados diz de quem é a falta, e não desenha trilho.
- **Pessoas desta vaga** — o ranking, com busca por nome e filtros rápidos (todas, compatíveis,
  abaixo de 35%, sem resposta), cada um com a própria contagem. Uma linha por pessoa: posição,
  iniciais, nome e cidade, trilho com o mínimo marcado, percentual de aderência e o técnico abaixo.
  Quem não respondeu aparece ao fim com "ainda não respondeu" no lugar do número, nunca com barra de
  zero. Clicar numa linha põe aquela pessoa em foco, em cima. A lista começa nas doze primeiras —
  uma vaga da base tem noventa candidaturas, e noventa trilhos seguidos viram rolagem, não leitura;
  "Mostrar todas" abre o resto.

## De onde vêm os dados hoje

`getJobRanking`, em `features/iel-demo/state/selectors.ts`, que chama `getAdherence` por candidatura
— o mesmo motor da mesa de seleção e do perfil do talento, para que a mesma pessoa nunca apareça com
dois percentuais diferentes em duas telas. A conta é `computeAdherence`, em
`features/iel-demo/analysis/adherence.ts`. Qual pessoa está aberta e qual aba está ativa é estado
local da tela, não vai para o `localStorage`.

Os gráficos vêm de `@workspace/charts/radar-chart`; as barras são marcação própria, porque são uma
série só com o número escrito ao lado.

## Ações do usuário

- Trocar de vaga — recarrega as duas leituras para a vaga escolhida. Estado local, não vai para o
  `localStorage`.
- Escolher uma pessoa, na lista ou no seletor — põe a leitura dela em cima. Não dispara ação do
  reducer: é leitura, não decisão.
- Ir para a pessoa anterior ou a próxima — anda no ranking sem abrir o seletor.
- Buscar e filtrar o ranking — por nome, e por compatíveis, abaixo do mínimo ou sem resposta.
  Filtro é recorte de leitura: não descarta ninguém do processo.
- Mostrar todas — abre a lista inteira, e volta às doze primeiras.
- Ver leitura completa — navega para `/iel/talentos/[talentId]?vaga=[jobId]`.

## Backend futuro

- O ranking passa a vir do serviço de seleção, já ordenado e paginado, com o mesmo contrato de
  `JobRankingEntry`: percentual, cobertura, pesos e estado de resposta por pessoa.
- A conta continua explicável até o ponto: o serviço devolve `byAxis` com média da empresa, resposta
  da pessoa, distância e peso, e não só o total.
- Quem abriu o resultado de qual vaga, e quando, vira registro de auditoria.

## Regras e limites

- **Aderência não é nota nem previsão de desempenho.** O rótulo em tela é "combina com a empresa", e
  a tela repete que a medida compara condições de trabalho declaradas pelos dois lados.
- **Ausência nunca vira zero.** Ponto sem resposta da empresa ou da pessoa fica sem número, e a tela
  diz de quem é a falta. Ordenar o silêncio como aderência mínima puniria quem não respondeu.
- **O corte de 35% é de atenção, não de eliminação.** Quem fica abaixo continua visível na mesa de
  seleção e a decisão é de quem lê (`ADHERENCE_THRESHOLD`).
- **Explicabilidade (LGPD, art. 20, § 1º).** O percentual de cada ponto e o peso declarado ficam
  visíveis, e o denominador ("3 de 5 pontos medidos") aparece junto do total.
- **Recorte por persona.** Gestor só abre o resultado de vagas da própria empresa.
- Cor sozinha não informa: abaixo do mínimo tem o traço no trilho e a frase em texto.

## Ligações

Vem de: seção "Seleção" do menu lateral e [Mesa de seleção](04-mesa-de-selecao.md), pelo botão
"Ver aderência", que chega com `?vaga=` preenchido.
Entra em: [Perfil do talento](08-perfil-do-talento.md), [Comparação entre candidatos](05-comparacao.md).

## Histórico

- 2026-09-19 — criada como resultado de aderência sob a vaga (`/iel/vagas/[jobId]/aderencia`).
- 2026-09-19 — virou tela própria no menu lateral, com seletor de vaga dentro dela: a rota sob a
  vaga saiu e a vaga passou a ser parâmetro.
- 2026-09-19 — as abas saíram: pessoa em cima, ranking da vaga abaixo na mesma página, e o ranking
  passou a ser o seletor de quem aparece em cima. A tela entrou na seção "Seleção" do menu lateral,
  junto de Hoje, Vagas e Empresas.
- 2026-09-19 — estilização: cartões nos blocos, seletor de vaga e de pessoa com busca, navegação
  anterior/próxima, filtros por status no ranking e os dois lados de cada ponto em números.
