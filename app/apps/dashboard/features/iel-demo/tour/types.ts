/**
 * O tour guiado: contrato entre o registro de tours e quem os executa.
 *
 * O tour é **dado**, não código: cada tela declara os seus passos em
 * `tours.ts` e ninguém precisa tocar em componente para acrescentar,
 * reordenar ou reescrever um passo. Quem executa (`use-tour.ts`) não sabe de
 * que tela se trata — recebe uma lista de passos e a percorre.
 *
 * O alvo de cada passo é um seletor CSS, e a convenção é `[data-tour="…"]`:
 * atributo escrito na marcação da tela, que não muda quando a classe do
 * Tailwind muda. Ancorar em classe utilitária quebraria o tour no primeiro
 * ajuste de layout.
 */

import type { TablerIcon } from '@tabler/icons-react';

/** Lado em que o balão se abre, quando o espaço permite. */
export type LadoDoPasso = 'top' | 'right' | 'bottom' | 'left' | 'over';

/** Alinhamento do balão em relação ao alvo. */
export type AlinhamentoDoPasso = 'start' | 'center' | 'end';

export type PassoDoTour = {
  /**
   * Seletor CSS do elemento destacado.
   *
   * Ausente = passo sem alvo: o balão abre centralizado, sobre a tela
   * escurecida. É como cada tour começa, para dizer o que ela responde antes
   * de apontar para qualquer canto.
   */
  seletor?: string;
  titulo: string;
  /** Uma ou duas frases. Quem lê está com o cliente na frente. */
  texto: string;
  lado?: LadoDoPasso;
  alinhamento?: AlinhamentoDoPasso;
};

export type TourDeTela = {
  /** Identificador estável; entra na URL e no `localStorage`. */
  id: string;
  /** Nome da tela, como o menu a chama. */
  titulo: string;
  /** A pergunta que a tela responde, em meia linha. */
  descricao: string;
  icone: TablerIcon;
  /**
   * Rota da tela. O diálogo navega até ela antes de começar, quando o tour
   * escolhido não é o da tela em que se está.
   */
  rota: string;
  /**
   * Prefixos que também contam como "estou nesta tela".
   *
   * A mesa de seleção é `/vagas/<id>`, que não é igual a `/vagas`: sem isto,
   * o tour da mesa nunca se reconheceria como o tour da tela atual.
   */
  casaCom?: (pathname: string) => boolean;
  passos: PassoDoTour[];
};
