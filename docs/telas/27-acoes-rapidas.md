# Ações rápidas

**Rota:** nenhuma — é um botão fixo no canto inferior direito, em todas as telas do analista
**Componente:** `apps/dashboard/components/iel-demo/layout/acoes-rapidas.tsx`, montado uma vez em
`layout/iel-shell.tsx`
**Reaproveita:** `chat/mind-sheet.tsx` (o assistente), `overview/pendencias.ts` (a fila),
`mapa-cultural/plano-cultural.tsx` (o desenho do plano)
**Persona:** Analista IEL
**Última atualização:** 2026-09-20

## O que a tela faz

Responde "preciso disto agora, sem sair de onde estou". Um botão redondo de 48px no canto abre um
leque com quatro portas; três delas abrem aba lateral e se resolvem ali mesmo.

Substitui a pílula **Pergunte ao Mind**, que ocupava cerca de 180px fixos sobre o conteúdo de toda
tela para oferecer uma porta só. O leque cobra o mesmo canto e entrega quatro — é a mesma economia
do menu recolhido da barra lateral: a porta não some, só para de disputar a dobra com o que a
analista veio ler.

O que entra no leque é o que vale de **qualquer** tela. "Registrar encaminhamento", "registrar
ligação" e "responder pergunta" ficam de fora porque dependem de uma vaga ou de uma pessoa
específica: elas já moram na fila, que é a primeira porta.

## O que aparece

- **Botão do canto**: o símbolo da marca, com o contador de pendências em pastilha vermelha quando
  há fila. Aberto, o símbolo vira uma cruz girada — fechar é desfazer o abrir.
- **Leque**, de baixo para cima, com o rótulo sempre escrito (o público operacional tem baixo
  letramento digital, R10; ícone mudo obrigaria a abrir para descobrir):
  1. **Precisa de você hoje** — com o número de pendências
  2. **Análise de cultura**
  3. **Mapa de cultura**
  4. **Pergunte ao Mind** — o mais perto do polegar, porque é a porta mais usada

### Aba "Precisa de você hoje"

A mesma fila do [Início](01-visao-geral.md) e do sino do cabeçalho
([Notificações](28-notificacoes.md)) — não uma segunda lista com regra própria. O que muda é o
alcance: quem está no meio de uma vaga olha o que falta sem perder a tela.

Filtro por prioridade (Todas / Alta / Média / Normal) igual ao do Início, e uma linha por
pendência com o tipo, o título, o resumo, o prazo colorido e o **verbo que resolve**. O verbo fecha
a aba: quem clicou escolheu sair.

### Aba "Análise de cultura"

A leitura de **um par**: uma pessoa contra uma empresa. Dois passos de busca (pessoa, depois
empresa) e então:

- **Aderência** em destaque, com barra, faixa, quantos temas foram comparados e em quantos a equipe
  diverge da gestão. Abaixo de dois temas respondidos, o texto avisa para ler o percentual como
  indício, não como medida.
- **Plano cultural com os dois pontos**, em posição absoluta, ligados por uma linha. É o
  `PlanoCultural` da aba da empresa, sem cópia. A posição é absoluta de propósito: o modo alvo
  (empresa no centro, pessoa no raio da aderência) existe para comparar _muitas_ pessoas contra uma
  empresa e, com dois pontos, jogaria fora o que se quer ver aqui — em que quadrante cada um está.
  Por isso os rótulos dos quadrantes e dos eixos ficam.
- **Tema a tema**: o nome do tema, um ✓ ou um ⚠, e o que cada lado respondeu, escrito. O percentual
  diz _quanto_; só isto diz _em quê_.

### Aba "Mapa de cultura"

A leitura pelo outro lado: **uma empresa contra a base**. Busca a empresa e mostra o mesmo
`PlanoCultural` da [aba da empresa](15-mapa-de-cultura.md) — empresa no centro, anéis de 85%, 65% e
35%, cada pessoa no raio da própria aderência — com as cinco primeiras nomeadas embaixo, em ordem.

Quem não está entre as cinco continua desenhado, só que discreto: ver a nuvem inteira em volta é o
que diz se as cinco são destaque real ou o topo de um empate.

### Aba "Pergunte ao Mind"

Inalterada — é o `MindSheet` que já existia, agora aberto pelo leque.

## De onde vêm os dados hoje

| Aba                | Origem                                                                                                                               |
| ------------------ | ------------------------------------------------------------------------------------------------------------------------------------ |
| Fila               | `components/iel-demo/overview/pendencias.ts` → `montarPendencias(state)`                                                             |
| Análise de cultura | `getCultureFit(state, talentId, companyId)`; pessoas de `ALL_TALENTS` + `state.importedTalents`, empresas de `getVisibleCompanies`   |
| Mapa de cultura    | `getCultureMapPoints(state, 'talentos')` e `getCompanyCultureAnswers` para montar o ponto da empresa, como faz `mapa-da-empresa.tsx` |
| Mind               | `features/iel-demo/chat/mind.ts` e `/api/iel/assistant`                                                                              |

O recorte é o da persona: o que `getVisible*` não devolve não aparece aqui também.

A empresa do mapa é montada no componente, e não lida de `getCultureMapPoints`, porque varrer as
2.500 da carteira para achar uma só seria trabalho jogado fora a cada render. As pessoas vêm do
índice, que já devolve só quem respondeu o questionário.

## Ações do usuário

| Ação                              | O que acontece                                          |
| --------------------------------- | ------------------------------------------------------- |
| Clicar no botão do canto          | abre ou fecha o leque                                   |
| `Esc`, clique fora ou navegar     | fecha o leque (o `Esc` devolve o foco ao botão)         |
| Escolher uma porta                | abre a aba lateral correspondente                       |
| Filtrar por prioridade na fila    | recorta a lista, sem tocar no estado                    |
| Clicar no verbo de uma pendência  | navega e fecha a aba                                    |
| **Trocar de pessoa / de empresa** | volta ao passo de busca                                 |
| Abrir a análise completa / o mapa | navega para o perfil da pessoa ou para a aba da empresa |

Nenhuma ação do reducer é disparada: o leque lê e leva, não escreve.

## Backend futuro

Nada de novo: as quatro portas consomem os mesmos seletores das telas que já existem. Quando a fila
e a cultura vierem do servidor, o leque acompanha sem mudança — ele não tem cálculo próprio, e é
justamente esta a regra que o mantém honesto: **duas telas nunca mostram percentuais diferentes
para o mesmo par.**

## Regras e limites

- **Não aparece em tela por link.** Candidato, colaborador e empresa não têm assistente nem fila; a
  checagem é `ehTelaPorLink(pathname)`, a mesma do Mind.
- **O gestor vê só o Mind.** A fila é do trabalho do IEL e as duas leituras de cultura varrem a base
  inteira — seriam porta para o recorte de outras empresas (PRODUTO.md §5). Sem as outras três, um
  leque de um item é um botão com passo a mais, então para ele o canto volta a ser o botão do Mind.
- **O leque não cria leitura nova.** Toda conta que ele mostra é a de outra tela, pelo mesmo
  seletor.
- **O recuo no celular é o VLibras.** O widget do governo desenha o próprio botão num shadow DOM
  `fixed` com o mesmo `z-40` e, no telefone, estaciona no canto inferior direito — medido em 390px,
  ele ocupa 338,728 num quadrado de 40px, exatamente onde o botão cairia. Empatados no `z`, o
  VLibras vence por vir depois no documento e o leque ficaria inclicável. Por isso o canto direito é
  dele no telefone (`right-16 sm:right-4`). Do `sm` para cima o VLibras sobe para o meio da lateral.
- **O leque é menu de canto, não diálogo**: não prende o foco nem tranca a página. As abas, sim, são
  `Sheet` e se comportam como diálogo.

## Ligações

Alcançável de qualquer tela do analista. Vizinho do sino ([Notificações](28-notificacoes.md)) e do
[Tour guiado](26-tour-guiado.md): os três moram fora das telas e atravessam todas.

Leva para: [Início](01-visao-geral.md) e o verbo de cada pendência, [Perfil do
talento](08-perfil-do-talento.md) / [Análise de aderência](21-analise-de-aderencia.md), e [Mapa de
Cultura](15-mapa-de-cultura.md).

## Em aberto

A fila aparece em três lugares — o cartão do Início, o sino do cabeçalho e este leque —, e o sino e
o botão do canto mostram o mesmo contador na mesma dobra. Um dos dois deve sair; a decisão não foi
tomada.

## Histórico

- 2026-09-20 — criada. O botão fixo "Pergunte ao Mind" vira leque com quatro portas.
