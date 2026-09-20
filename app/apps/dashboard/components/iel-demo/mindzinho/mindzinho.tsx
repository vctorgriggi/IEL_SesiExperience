import {
  MINIMO_DO_CORPO,
  ROTULO_DA_POSE,
  type PoseDoMindzinho
} from '@/features/iel-demo/mindzinho/poses';

import { cn } from '@workspace/ui/lib/utils';

/**
 * O Mindzinho, em quatro poses.
 *
 * ## Como a pose é escolhida
 *
 * Não é aqui. A pose vem de `poseDe(estado)`
 * (`features/iel-demo/mindzinho/poses.ts`): quem monta a tela informa em que
 * estado o sistema está e recebe a pose. Se a tela pudesse escolher a cara do
 * boneco, a pose de atenção apareceria por estética e deixaria de significar
 * "tem algo a resolver" — que é a única razão de ela existir.
 *
 * ## Por que um SVG só, com grupos sobrepostos
 *
 * O desenho compartilhado (cabeça, tronco, antena) é desenhado uma vez; o que
 * muda por pose — o braço, os olhos, a boca — são quatro grupos empilhados, e
 * só o da pose ativa fica opaco. A troca de pose é então uma transição de
 * `opacity`, que é literalmente a fusão cruzada de 120 ms que o padrão pede, e
 * sai sem guardar a pose anterior em estado nem montar dois SVG.
 *
 * Só `transform` e `opacity` animam. Nada de largura, altura ou sombra: essas
 * disparam layout e pintura a cada quadro, e num painel que já desenha tabela
 * e gráfico o custo aparece.
 *
 * ## Regras de uso que o componente não consegue impor
 *
 * - **Sempre com rótulo de texto por perto.** O boneco sozinho não comunica;
 *   ele acompanha uma frase, não substitui uma.
 * - **`decorativo` quando já existe texto ao lado** dizendo a mesma coisa,
 *   para o leitor de tela não anunciar duas vezes.
 *
 * Abaixo de 28px o componente troca sozinho para o avatar (cabeça enquadrada):
 * o corpo inteiro nesse tamanho vira mancha, e uma mancha não tem pose.
 */

export type MindzinhoProps = {
  /** Derive de `poseDe(estado)`. O padrão é a pose de abertura. */
  pose?: PoseDoMindzinho;
  /** Lado do quadrado, em px. 56 no computador, 48 no celular. */
  size?: number;
  /** Só a cabeça, enquadrada: para botão flutuante e bolha de conversa. */
  avatar?: boolean;
  /** `escuro` para fundo azul-noite (barra, botão flutuante). */
  tema?: 'claro' | 'escuro';
  /** Sem rótulo para o leitor de tela: use quando há texto ao lado. */
  decorativo?: boolean;
  className?: string;
};

/**
 * As cores, por tema, nos tokens do produto.
 *
 * Variante como `Record` e não como `cva`: é o padrão do código do IEL
 * (`metricas/cores.ts`), e `cva` não é usado neste app.
 */
const CORES: Record<
  'claro' | 'escuro',
  { corpo: string; face: string; detalhe: string; traco: string }
> = {
  claro: {
    corpo: 'hsl(var(--primary))',
    face: 'hsl(var(--primary-foreground))',
    detalhe: 'hsl(var(--brand-accent))',
    traco: 'hsl(var(--primary))'
  },
  escuro: {
    corpo: 'hsl(var(--primary-foreground))',
    face: 'hsl(var(--primary))',
    detalhe: 'hsl(var(--brand-accent))',
    traco: 'hsl(var(--primary))'
  }
};

export function Mindzinho({
  pose = 'ola',
  size = 56,
  avatar = false,
  tema = 'claro',
  decorativo = false,
  className
}: MindzinhoProps) {
  const cores = CORES[tema];
  const soCabeca = avatar || size < MINIMO_DO_CORPO;

  /*
   * `role="img"` com rótulo, ou nada para o leitor de tela. O rótulo descreve
   * o estado ("Mindzinho explicando"), não o desenho: "boneco azul com antena"
   * não serve de nada a quem não vê a tela.
   */
  const acessibilidade = decorativo
    ? ({ 'aria-hidden': true } as const)
    : ({ role: 'img', 'aria-label': ROTULO_DA_POSE[pose] } as const);

  return (
    <svg
      {...acessibilidade}
      data-pose={pose}
      width={size}
      height={size}
      viewBox={soCabeca ? '10 4 44 44' : '0 0 64 64'}
      className={cn('mz shrink-0 overflow-visible', className)}
    >
      {/* ---------------- Antena ---------------- */}
      <line
        x1="32"
        y1="11"
        x2="32"
        y2="6"
        stroke={cores.corpo}
        strokeWidth="2.5"
        strokeLinecap="round"
      />
      {/*
       * A ponta da antena é o único ponto laranja do desenho, e é ela que
       * pulsa na pose de atenção — duas vezes e para. Nada pisca sem parar:
       * um alerta perpétuo deixa de ser alerta e vira ruído que a analista
       * aprende a ignorar.
       */}
      <circle
        className="mz-antena"
        cx="32"
        cy="4.5"
        r="3"
        fill={pose === 'atencao' ? cores.detalhe : cores.corpo}
      />

      {/* ---------------- Cabeça ---------------- */}
      <rect
        x="12"
        y="11"
        width="40"
        height="32"
        rx="11"
        fill={cores.corpo}
      />

      {/* ---------------- Tronco (só no corpo inteiro) ---------------- */}
      {soCabeca ? null : (
        <>
          <rect
            x="19"
            y="46"
            width="26"
            height="16"
            rx="7"
            fill={cores.corpo}
          />
          {/* A gola em laranja amarra o boneco à assinatura da marca. */}
          <rect
            x="26"
            y="45"
            width="12"
            height="3"
            rx="1.5"
            fill={cores.detalhe}
          />
        </>
      )}

      {/* ================ O que muda por pose ================ */}

      {/*
       * `ola`: olhos abertos, boca em curva e a mão levantada. É a pose de
       * quem chega, e a única que aparece antes de qualquer pergunta.
       */}
      <g
        className="mz-pose"
        style={{ opacity: pose === 'ola' ? 1 : 0 }}
      >
        <circle
          cx="24"
          cy="25"
          r="3.2"
          fill={cores.face}
        />
        <circle
          cx="40"
          cy="25"
          r="3.2"
          fill={cores.face}
        />
        <path
          d="M26 34 Q32 38 38 34"
          stroke={cores.face}
          strokeWidth="2.2"
          strokeLinecap="round"
          fill="none"
        />
        {soCabeca ? null : (
          <path
            d="M46 52 L54 44"
            stroke={cores.corpo}
            strokeWidth="4"
            strokeLinecap="round"
          />
        )}
      </g>

      {/*
       * `pensando`: olhos em traço, para cima, e três pontos subindo. O
       * assistente está montando a resposta — e a espera precisa ter cara de
       * espera, senão a analista pergunta de novo.
       */}
      <g
        className="mz-pose"
        style={{ opacity: pose === 'pensando' ? 1 : 0 }}
      >
        <path
          d="M21 24 Q24 21 27 24"
          stroke={cores.face}
          strokeWidth="2.4"
          strokeLinecap="round"
          fill="none"
        />
        <path
          d="M37 24 Q40 21 43 24"
          stroke={cores.face}
          strokeWidth="2.4"
          strokeLinecap="round"
          fill="none"
        />
        <circle
          cx="28"
          cy="34"
          r="1.6"
          fill={cores.face}
        />
        <circle
          cx="32"
          cy="34"
          r="1.6"
          fill={cores.face}
        />
        <circle
          cx="36"
          cy="34"
          r="1.6"
          fill={cores.face}
        />
      </g>

      {/*
       * `explicando`: olhos abertos, boca aberta e o braço apontando para o
       * lado — para o número, para a coluna, para o que está sendo explicado.
       */}
      <g
        className="mz-pose"
        style={{ opacity: pose === 'explicando' ? 1 : 0 }}
      >
        <circle
          cx="24"
          cy="25"
          r="3.2"
          fill={cores.face}
        />
        <circle
          cx="40"
          cy="25"
          r="3.2"
          fill={cores.face}
        />
        <ellipse
          cx="32"
          cy="35"
          rx="4.5"
          ry="3.2"
          fill={cores.face}
        />
        {soCabeca ? null : (
          <>
            <path
              d="M45 53 L56 53"
              stroke={cores.corpo}
              strokeWidth="4"
              strokeLinecap="round"
            />
            <circle
              cx="58"
              cy="53"
              r="2.5"
              fill={cores.detalhe}
            />
          </>
        )}
      </g>

      {/*
       * `atencao`: sobrancelhas baixas, boca reta e o traço de alerta no
       * peito. Sem cor sozinha carregando o recado — a forma muda também,
       * porque quem não distingue o laranja precisa ler a mesma coisa.
       */}
      <g
        className="mz-pose"
        style={{ opacity: pose === 'atencao' ? 1 : 0 }}
      >
        <path
          d="M20 21 L28 24"
          stroke={cores.face}
          strokeWidth="2.2"
          strokeLinecap="round"
        />
        <path
          d="M44 21 L36 24"
          stroke={cores.face}
          strokeWidth="2.2"
          strokeLinecap="round"
        />
        <circle
          cx="24"
          cy="28"
          r="3.2"
          fill={cores.face}
        />
        <circle
          cx="40"
          cy="28"
          r="3.2"
          fill={cores.face}
        />
        <path
          d="M27 36 L37 36"
          stroke={cores.face}
          strokeWidth="2.2"
          strokeLinecap="round"
        />
        {soCabeca ? null : (
          <>
            <path
              d="M32 50 L32 55"
              stroke={cores.detalhe}
              strokeWidth="2.6"
              strokeLinecap="round"
            />
            <circle
              cx="32"
              cy="58.5"
              r="1.4"
              fill={cores.detalhe}
            />
          </>
        )}
      </g>
    </svg>
  );
}
