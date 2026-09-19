/**
 * A barra de abas dos filtros do /iel, sem rolagem horizontal.
 *
 * As abas já ficaram dentro de um `overflow-x-auto`: como a `Tabs` é item de
 * um `flex` e podia encolher abaixo do conteúdo, a barra virava um contêiner
 * de rolagem — barrinha cinza à mostra mesmo sobrando espaço — e, pior, um
 * eixo com `overflow` diferente de `visible` faz o outro virar `auto`: o anel
 * de foco de 3px da aba saía cortado em cima e embaixo.
 *
 * Aqui a barra não rola: quando as abas não cabem numa linha, elas quebram
 * para a linha de baixo. A altura de 36px vira mínima (a linha única fica
 * igual à de antes) e cada aba mantém os 30px da pílula, que dependiam de uma
 * altura fixa no pai.
 */
export const ABAS_SEM_ROLAGEM =
  'min-h-9 flex-wrap group-data-[orientation=horizontal]/tabs:h-auto **:data-[slot=tabs-trigger]:h-7.5';
