/**
 * A pose do Mindzinho é derivada do estado da tela, nunca escolhida à mão.
 *
 * É a regra inteira, e é por isso que este arquivo existe. Se cada tela
 * pudesse passar `pose="atencao"` porque achou bonito, a cara do boneco
 * deixaria de ser informação e viraria enfeite. Derivada, a pose de atenção só
 * aparece quando há algo a resolver — e a analista aprende a confiar nela.
 */

export type PoseDoMindzinho = 'ola' | 'pensando' | 'explicando' | 'atencao';

/** Os estados que a interface reconhece. Estado novo entra aqui com a pose. */
export type EstadoDoMindzinho =
  | 'abertura'
  | 'primeira-visita'
  | 'tela-vazia'
  | 'preparando-resposta'
  | 'consulta-rodando'
  | 'resposta-entregue'
  | 'falta-resposta'
  | 'prazo-vencendo'
  | 'tema-em-aberto'
  | 'erro';

/** O `Record` completo é o contrato: estado sem pose não compila. */
const POSE_DO_ESTADO: Record<EstadoDoMindzinho, PoseDoMindzinho> = {
  abertura: 'ola',
  'primeira-visita': 'ola',
  'tela-vazia': 'ola',

  'preparando-resposta': 'pensando',
  'consulta-rodando': 'pensando',

  'resposta-entregue': 'explicando',

  'falta-resposta': 'atencao',
  'prazo-vencendo': 'atencao',
  'tema-em-aberto': 'atencao',
  erro: 'atencao'
};

/** A única porta de decisão da pose. */
export function poseDe(estado: EstadoDoMindzinho): PoseDoMindzinho {
  return POSE_DO_ESTADO[estado];
}

/**
 * O que o leitor de tela anuncia. Descreve o estado, não o desenho: "boneco
 * azul com antena" não serve a quem não vê.
 */
export const ROTULO_DA_POSE: Record<PoseDoMindzinho, string> = {
  ola: 'Mindzinho cumprimentando',
  pensando: 'Mindzinho preparando a resposta',
  explicando: 'Mindzinho explicando',
  atencao: 'Mindzinho apontando algo que precisa de atenção'
};

/**
 * Abaixo de 28px só o avatar, nunca o corpo inteiro: nesse tamanho braço,
 * antena e tronco somem no mesmo pixel, e mancha não tem pose.
 */
export const MINIMO_DO_CORPO = 28;
