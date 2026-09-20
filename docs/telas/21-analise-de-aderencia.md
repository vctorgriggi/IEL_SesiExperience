# Análise de aderência

**Rota:** aba **Onde ela se encaixa** em `/iel/talentos/[talentId]` (abre por padrão; com
`?vaga=<jobId>` a leitura já abre na empresa daquela vaga)
**Rota legada:** `/iel/analise-de-aderencia` **redireciona** para a mesa da vaga (`?vaga=`) ou para a
lista de vagas — link antigo não dá 404
**Componentes:** `apps/dashboard/components/iel-demo/talents/aderencia-da-pessoa.tsx`, com
`aderencia/radar-de-aderencia.tsx` e `aderencia/pontos-do-dia.tsx`
**Persona:** Analista IEL
**Última atualização:** 2026-09-19

## O que a tela faz

Responde **"esta pessoa combina com quais empresas?"** — não só com aquela em cuja vaga ela está
sendo olhada agora. Ao lado da lista de empresas, a leitura completa de uma delas: o percentual com o
denominador, o radar dos dez temas e o tema a tema com os dois lados escritos.

Era tela própria no menu lateral, organizada por vaga: todas as pessoas da vaga, ordenadas, e uma
pessoa por vez aberta em cima. Mas o ranking por vaga é exatamente o que a [Mesa de
seleção](04-mesa-de-selecao.md) faz — a tela repetia a mesa com outra roupa. E o fit, como o cliente
disse, _"é sobre a cultura da empresa. Não é sobre a vaga"_ (00:31:38). Ancorada na pessoa, a mesma
conta passa a responder o que faz o banco de talentos valer.

## O que aparece

Na ordem da tela:

- **Onde ela se encaixa** — a lista de empresas comparadas, ordenada por aderência e numerada, com
  setor, percentual, faixa nomeada, denominador ("4 de 10 temas medidos") e a marca de quem está
  abaixo do corte. A linha diz também quando a pessoa já se candidatou àquela empresa. Clicar troca
  a leitura ao lado; a empresa aberta é trazida para a vista quando vem de um link com `?vaga=`.
- **Sem base suficiente para posição** — o grupo do fim da lista, sem número e sem faixa, com o
  percentual à vista e a linha clicável. Abaixo de dois temas em comum, um tema vira 0 ou 100 e nada
  entre os dois: o número existe, mas não distingue ninguém. Não ranquear não é descartar.
- **A leitura na empresa aberta** — o percentual em corpo grande com a frase que o interpreta, a
  barra com o mínimo de 35% marcado, o denominador e a faixa; a cor vem de `metricas/cores.ts`
  (`textoDaAderencia`, `barraDaAderencia`), a mesma da mesa de seleção.
- **Divergência gestão × equipe**, quando existe: quantos temas a empresa responde diferente entre
  gestão e equipe, com o aviso de que a leitura usa a média declarada e a divergência fica registrada
  no contexto da empresa. A média é o perfil, a dispersão é o diagnóstico.
- **Radar dos dez temas** — o polígono da empresa e o da pessoa sobre a mesma escala, com legenda
  dizendo que a escala são as opções do questionário, não uma nota. Tema sem um dos lados abre o
  polígono em vez de ser desenhado como mínimo. Em volta do polígono o nome vai curto
  (`AXIS_SHORT_LABEL`), porque ali o espaço é do desenho.
- **Em que ela combina e em que difere** — os dez temas um a um: a aderência de cada um, o peso
  declarado pela empresa, o trilho com o corte de 35% marcado e, embaixo, os dois lados em números
  ("Empresa: média 1,4 de 3 · Helena: opção 1 de 3"). Tema sem um dos lados diz de quem é a falta, e
  não desenha trilho.
- **Atalhos** — abrir a empresa, abrir o mapa de cultura dela e as vagas abertas ali. Sem vaga
  aberta, a tela diz que o encaixe continua valendo para a próxima que abrir.
- **Os limites, por escrito**, no rodapé: aderência não é nota nem previsão de desempenho, o corte de
  35% marca sem eliminar e ausência nunca vira zero.

Quando a pessoa ainda não respondeu o questionário, não há número: a tela diz isso em vez de mostrar
o menor deles. Quando nenhuma empresa da carteira fechou tema suficiente, ela diz isso também.

## O que saiu, e por quê

- **O ranking da vaga** ("Pessoas desta vaga", com busca e filtros por compatível / abaixo de 35% /
  sem resposta). É a Mesa de seleção, que já existe e é a cena do pitch (M5). Duas telas para o mesmo
  ranking era uma a mais.
- **O seletor de vaga e o de pessoa.** Sem tela própria no menu, ninguém chega precisando escolher
  processo nenhum: a pessoa é o caminho, e a vaga vem do link.

## De onde vêm os dados hoje

`getCultureMapPoints(state, 'empresas')` dá as empresas com perfil fechado — só elas têm contra o
que medir —, e `getCultureFit` responde por empresa com a aderência, a divergência gestão × equipe e
a leitura tema a tema. A conta é `computeThemeAdherence`, em
`features/iel-demo/analysis/adherence.ts`, pela ponte `getTalentCompanyAdherence`: o mesmo motor da
mesa de seleção e do mapa, para que a mesma pessoa nunca apareça com dois percentuais diferentes em
duas telas.

Os índices ficam memorizados por `state`: a carteira tem 2.500 empresas e a base curada 268 pessoas,
e um clique de aba não pode refazer a conta inteira.

Qual empresa está aberta é estado local da tela, não vai para o `localStorage`.

Os gráficos vêm de `@workspace/charts/radar-chart`; as barras são marcação própria, porque são uma
série só com o número escrito ao lado.

## Ações do usuário

- Escolher uma empresa na lista — troca a leitura ao lado. Não dispara ação do reducer: é leitura,
  não decisão.
- Abrir a empresa, o mapa de cultura dela ou uma vaga aberta.
- Nenhuma ação altera estado de domínio nesta aba.

## Backend futuro

- A lista de empresas passa a vir do serviço, já ordenada e paginada, com o mesmo contrato:
  percentual, cobertura, pesos e estado de resposta.
- A conta continua explicável até o tema: o serviço devolve `byAxis` com média da empresa, resposta
  da pessoa, distância e peso, e não só o total.
- Quem abriu a leitura de quem, e quando, vira registro de auditoria.

## Regras e limites

- **Aderência não é nota nem previsão de desempenho.** O rótulo em tela é "combina com a empresa", e
  a tela repete que a medida compara condições de trabalho declaradas pelos dois lados.
- **A pessoa nunca é ranqueada em abstrato.** Aqui se ordenam **empresas para uma pessoa**; a lista
  de "melhores pessoas" continua não existindo, e a tela diz isso no rodapé da lista.
- **Ausência nunca vira zero.** Tema sem resposta da empresa ou da pessoa fica sem número, e a tela
  diz de quem é a falta. Ordenar o silêncio como aderência mínima puniria quem não respondeu.
- **O corte de 35% é de atenção, não de eliminação.** Quem fica abaixo continua visível e a decisão é
  de quem lê (`ADHERENCE_THRESHOLD`).
- **Piso de evidência.** Abaixo de dois temas respondidos pelos dois lados não há posição atribuída,
  e o grupo é nomeado por escrito.
- **Explicabilidade (LGPD, art. 20, § 1º).** O percentual de cada tema e o peso declarado ficam
  visíveis, e o denominador ("4 de 10 temas medidos") aparece junto do total.
- **Recorte por persona.** O perfil da pessoa não abre para o gestor: ele vê pessoas apenas dentro de
  uma remessa enviada pelo IEL.
- Cor sozinha não informa: abaixo do mínimo tem o traço no trilho e a frase em texto.

## Ligações

Vem de: [Perfil do talento](08-perfil-do-talento.md), de que é a aba padrão;
[Mesa de seleção](04-mesa-de-selecao.md) e [Mapa de Cultura](15-mapa-de-cultura.md), pelo nome da
pessoa.
Entra em: [Contexto da empresa](10-contexto-da-empresa.md), [Mapa de Cultura](15-mapa-de-cultura.md).

## Histórico

- 2026-09-19 — criada como resultado de aderência sob a vaga (`/iel/vagas/[jobId]/aderencia`).
- 2026-09-19 — virou tela própria no menu lateral, com seletor de vaga dentro dela: a rota sob a
  vaga saiu e a vaga passou a ser parâmetro.
- 2026-09-19 — as abas saíram: pessoa em cima, ranking da vaga abaixo na mesma página, e o ranking
  passou a ser o seletor de quem aparece em cima. A tela entrou na seção "Seleção" do menu lateral.
- 2026-09-19 — estilização: cartões nos blocos, seletores com busca, filtros por status no ranking e
  os dois lados de cada ponto em números.
- 2026-09-19 — deixa de ser tela do menu e vira **aba da pessoa**: a leitura passa a ser "esta pessoa
  × as empresas em que ela se encaixa". O ranking por vaga saiu (é a mesa de seleção) e a rota antiga
  virou redirecionamento.
