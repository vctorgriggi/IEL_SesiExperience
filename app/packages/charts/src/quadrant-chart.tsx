'use client';

import {
  forwardRef,
  useState,
  type HTMLAttributes,
  type ReactNode
} from 'react';
import { cva, type VariantProps } from 'class-variance-authority';
import {
  Customized,
  ReferenceArea,
  ReferenceLine,
  ResponsiveContainer,
  Scatter,
  ScatterChart,
  XAxis,
  YAxis,
  ZAxis
} from 'recharts';

import { cn } from './lib/utils';

/*
 * Grid de três faixas em cada direção: os rótulos de eixo ocupam as bordas e o
 * plano fica na célula central. Posicionamento absoluto colocava o nome do eixo
 * por cima do nome do quadrante; com grid a colisão deixa de ser possível.
 */
const quadrantChartVariants = cva(
  'grid w-full grid-cols-[auto_minmax(0,1fr)_auto] gap-1.5',
  {
    variants: {
      size: {
        sm: 'max-w-[340px]',
        default: 'max-w-[420px]',
        lg: 'max-w-[540px]'
      }
    },
    defaultVariants: {
      size: 'default'
    }
  }
);

/**
 * Peso visual do ponto. O gráfico deriva raio e opacidade do tom para que uma
 * base grande não vire borrão: `muted` continua desenhado e clicável, apenas
 * sai do primeiro plano.
 */
export type QuadrantChartTone = 'reference' | 'selected' | 'muted' | 'default';

/** Raios em px. Piso de 4px (marca de 8px) vale para todos os tons. */
const RAIO_POR_TOM: Record<QuadrantChartTone, number> = {
  reference: 9,
  selected: 8,
  muted: 4,
  default: 5.5
};

const RAIO_HOVER = 7.5;

const OPACIDADE_POR_TOM: Record<QuadrantChartTone, number> = {
  reference: 1,
  selected: 1,
  muted: 0.45,
  default: 0.9
};

/** Alvo mínimo de ponteiro, independente do tamanho da marca. */
const RAIO_DE_TOQUE = 12;

/** Anel na cor da superfície, para marcas que se sobrepõem. */
const ANEL_DE_SUPERFICIE = 2;

export type QuadrantChartPoint = {
  id: string;
  /** Coordenadas no domínio informado em `domain`. */
  x: number;
  y: number;
  color: string;
  symbol?: 'circle' | 'square';
  tone?: QuadrantChartTone;
  /** Etiqueta fixa acima do ponto. Uma ou duas por gráfico, nunca em todas. */
  label?: string | null;
  /**
   * Segundo ponto ligado por linha tracejada, para quando a mesma entidade tem
   * duas leituras — o que ela declara e o que a equipe relata.
   */
  tether?: { x: number; y: number } | null;
};

export type QuadrantChartCorner =
  | 'top-left'
  | 'top-right'
  | 'bottom-left'
  | 'bottom-right';

export type QuadrantChartQuadrant = {
  id: string;
  label: string;
  corner: QuadrantChartCorner;
  highlighted?: boolean;
  dimmed?: boolean;
};

/** Círculo de referência ao redor de um ponto, em unidades do domínio. */
export type QuadrantChartRing = {
  id: string;
  x: number;
  y: number;
  radius: number;
  color?: string;
  /** Escrito na borda do anel. Sem ele o raio é grandeza sem legenda. */
  label?: string | null;
};

/** Linha entre dois pontos, com rótulo opcional no meio. */
export type QuadrantChartConnection = {
  from: { x: number; y: number };
  to: { x: number; y: number };
  label?: string | null;
  color?: string;
};

/** Palavra única em cada borda, nomeando o extremo daquele eixo. */
export type QuadrantChartAxisLabels = {
  top?: string;
  bottom?: string;
  left?: string;
  right?: string;
};

export type QuadrantChartProps = Omit<
  HTMLAttributes<HTMLDivElement>,
  'onSelect'
> &
  VariantProps<typeof quadrantChartVariants> & {
    points: QuadrantChartPoint[];
    quadrants?: QuadrantChartQuadrant[];
    rings?: QuadrantChartRing[];
    connection?: QuadrantChartConnection | null;
    axisLabels?: QuadrantChartAxisLabels;
    /** Extremos dos dois eixos. Fixos por quem usa: o gráfico não os infere. */
    domain?: [number, number];
    /** Círculo tracejado no centro, em unidades do domínio. */
    neutralRadius?: number;
    /**
     * As duas linhas centrais. Desligue quando o plano não for de quadrantes:
     * elas nomeiam os eixos, e sem eixos viram só duas riscas.
     */
    showCrosshair?: boolean;
    onSelect?: (id: string) => void;
    onHoverChange?: (id: string | null) => void;
    /** Conteúdo do balão de hover. Sem isso, o gráfico não mostra balão. */
    renderTooltip?: (point: QuadrantChartPoint) => ReactNode;
    ariaLabel?: string;
  };

type Escala = (valor: number) => number;

type CamadaProps = {
  xAxisMap?: Record<string, { scale: Escala }>;
  yAxisMap?: Record<string, { scale: Escala }>;
};

function escalasDe(props: CamadaProps): { ex: Escala; ey: Escala } | null {
  const x = props.xAxisMap ? Object.values(props.xAxisMap)[0] : undefined;
  const y = props.yAxisMap ? Object.values(props.yAxisMap)[0] : undefined;
  if (typeof x?.scale !== 'function' || typeof y?.scale !== 'function') {
    return null;
  }
  return { ex: x.scale, ey: y.scale };
}

const CANTO_PARA_POSICAO = {
  'top-left': 'insideTopLeft',
  'top-right': 'insideTopRight',
  'bottom-left': 'insideBottomLeft',
  'bottom-right': 'insideBottomRight'
} as const satisfies Record<QuadrantChartCorner, string>;

function limitesDoQuadrante(
  corner: QuadrantChartCorner,
  [min, max]: [number, number]
): { x1: number; x2: number; y1: number; y2: number } {
  const esquerda = corner === 'top-left' || corner === 'bottom-left';
  const cima = corner === 'top-left' || corner === 'top-right';
  return {
    x1: esquerda ? min : 0,
    x2: esquerda ? 0 : max,
    y1: cima ? 0 : min,
    y2: cima ? max : 0
  };
}

const CLASSE_DA_BORDA =
  'pointer-events-none select-none place-self-center text-[10px] font-medium uppercase tracking-[0.12em] text-muted-foreground/70';

/**
 * Plano de quatro quadrantes.
 *
 * Existe para posicionar entidades em dois eixos contínuos e comparar
 * distâncias entre elas — não para pontuar ninguém. Desenha todos os pontos
 * que recebe: quem está fora do foco fica discreto, nunca escondido.
 *
 * A cor não é o único canal de identidade: a forma (círculo ou quadrado)
 * carrega o tipo, então o gráfico continua legível em daltonismo e em
 * impressão preto e branco.
 */
const QuadrantChart = forwardRef<HTMLDivElement, QuadrantChartProps>(
  (
    {
      className,
      size,
      points,
      quadrants = [],
      rings = [],
      connection,
      axisLabels,
      domain = [-1, 1],
      neutralRadius,
      showCrosshair = true,
      onSelect,
      onHoverChange,
      renderTooltip,
      ariaLabel,
      ...props
    },
    ref
  ) => {
    const [hovered, setHovered] = useState<{
      point: QuadrantChartPoint;
      cx: number;
      cy: number;
    } | null>(null);

    function definirHover(
      alvo: { point: QuadrantChartPoint; cx: number; cy: number } | null
    ) {
      setHovered(alvo);
      onHoverChange?.(alvo?.point.id ?? null);
    }

    const tomDe = (ponto: QuadrantChartPoint): QuadrantChartTone =>
      ponto.tone ?? 'default';

    function raioDe(ponto: QuadrantChartPoint): number {
      const tom = tomDe(ponto);
      if (
        ponto.id === hovered?.point.id &&
        tom !== 'reference' &&
        tom !== 'selected'
      ) {
        return RAIO_HOVER;
      }
      return RAIO_POR_TOM[tom];
    }

    /** Camada sob os pontos: zona neutra, anéis e linhas de divergência. */
    const camadaDeFundo = (camada: CamadaProps) => {
      const escalas = escalasDe(camada);
      if (!escalas) return null;
      const { ex, ey } = escalas;
      const emPixels = (raio: number) => Math.abs(ex(raio) - ex(0));

      return (
        <g className="pointer-events-none">
          {neutralRadius ? (
            <circle
              className="stroke-border"
              cx={ex(0)}
              cy={ey(0)}
              fill="none"
              r={emPixels(neutralRadius)}
              strokeOpacity={0.5}
              strokeWidth={1}
            />
          ) : null}

          {rings.map((anel) => (
            <g key={anel.id}>
              <circle
                cx={ex(anel.x)}
                cy={ey(anel.y)}
                fill="none"
                r={emPixels(anel.radius)}
                stroke={anel.color ?? 'currentColor'}
                strokeDasharray="3 4"
                strokeOpacity={0.3}
                strokeWidth={1}
              />
              {/*
                Na base do anel, não no topo: o rótulo fixo do ponto central
                sobe, e no topo os dois se atropelavam.
              */}
              {anel.label ? (
                <text
                  className="fill-muted-foreground text-[9px] font-medium"
                  textAnchor="middle"
                  x={ex(anel.x)}
                  y={ey(anel.y) + emPixels(anel.radius) + 10}
                >
                  {anel.label}
                </text>
              ) : null}
            </g>
          ))}

          {points.map((ponto) =>
            ponto.tether && tomDe(ponto) !== 'muted' ? (
              <g key={`tether-${ponto.id}`}>
                <line
                  stroke={ponto.color}
                  strokeDasharray="4 4"
                  strokeOpacity={0.7}
                  strokeWidth={1.5}
                  x1={ex(ponto.x)}
                  x2={ex(ponto.tether.x)}
                  y1={ey(ponto.y)}
                  y2={ey(ponto.tether.y)}
                />
                <circle
                  cx={ex(ponto.tether.x)}
                  cy={ey(ponto.tether.y)}
                  fill="none"
                  r={raioDe(ponto) * 0.7}
                  stroke={ponto.color}
                  strokeWidth={1.5}
                />
              </g>
            ) : null
          )}
        </g>
      );
    };

    /** Camada sobre os pontos: linha de comparação e etiquetas fixas. */
    const camadaDeFrente = (camada: CamadaProps) => {
      const escalas = escalasDe(camada);
      if (!escalas) return null;
      const { ex, ey } = escalas;

      return (
        <g className="pointer-events-none">
          {connection ? (
            <>
              <line
                stroke={connection.color ?? 'currentColor'}
                strokeDasharray="5 4"
                strokeOpacity={0.8}
                strokeWidth={1.5}
                x1={ex(connection.from.x)}
                x2={ex(connection.to.x)}
                y1={ey(connection.from.y)}
                y2={ey(connection.to.y)}
              />
              {/*
                O rótulo vai na linha porque comprimento sugere quantidade, e
                aqui não é: o plano tem duas dimensões e a medida tem mais.
                Quem lê precisa ver o número, não deduzi-lo do tamanho.
              */}
              {connection.label ? (
                <text
                  className="fill-foreground text-[10px] font-semibold"
                  dy={-5}
                  textAnchor="middle"
                  x={(ex(connection.from.x) + ex(connection.to.x)) / 2}
                  y={(ey(connection.from.y) + ey(connection.to.y)) / 2}
                >
                  {connection.label}
                </text>
              ) : null}
            </>
          ) : null}

          {points.map((ponto) =>
            ponto.label ? (
              <text
                className="fill-foreground text-[11px] font-semibold"
                key={`label-${ponto.id}`}
                textAnchor="middle"
                x={ex(ponto.x)}
                y={ey(ponto.y) - raioDe(ponto) - 9}
              >
                {ponto.label}
              </text>
            ) : null
          )}
        </g>
      );
    };

    return (
      <div
        ref={ref}
        className={cn(quadrantChartVariants({ size }), className)}
        {...props}
      >
        {axisLabels?.top ? (
          <span className={cn(CLASSE_DA_BORDA, 'col-start-2 row-start-1')}>
            {axisLabels.top}
          </span>
        ) : null}
        {axisLabels?.left ? (
          <span
            className={cn(
              CLASSE_DA_BORDA,
              'col-start-1 row-start-2 [writing-mode:vertical-rl] rotate-180'
            )}
          >
            {axisLabels.left}
          </span>
        ) : null}
        {axisLabels?.right ? (
          <span
            className={cn(
              CLASSE_DA_BORDA,
              'col-start-3 row-start-2 [writing-mode:vertical-rl]'
            )}
          >
            {axisLabels.right}
          </span>
        ) : null}
        {axisLabels?.bottom ? (
          <span className={cn(CLASSE_DA_BORDA, 'col-start-2 row-start-3')}>
            {axisLabels.bottom}
          </span>
        ) : null}

        <div className="relative col-start-2 row-start-2 aspect-square w-full rounded-xl border border-border/70 bg-card/40">
          <ResponsiveContainer
            height="100%"
            width="100%"
          >
            <ScatterChart
              aria-label={ariaLabel}
              margin={{ top: 10, right: 10, bottom: 10, left: 10 }}
              onMouseLeave={() => definirHover(null)}
              role="img"
            >
              <XAxis
                dataKey="x"
                domain={domain}
                hide
                type="number"
              />
              <YAxis
                dataKey="y"
                domain={domain}
                hide
                type="number"
              />
              <ZAxis range={[0, 0]} />

              {quadrants.map((quadrante) => (
                <ReferenceArea
                  fill="currentColor"
                  fillOpacity={quadrante.highlighted ? 0.06 : 0}
                  key={quadrante.id}
                  label={{
                    value: quadrante.label,
                    position: CANTO_PARA_POSICAO[quadrante.corner],
                    offset: 10,
                    className: quadrante.highlighted
                      ? 'fill-primary'
                      : 'fill-muted-foreground',
                    fontSize: 10,
                    fontWeight: 600,
                    opacity: quadrante.dimmed ? 0.35 : 0.75
                  }}
                  stroke="none"
                  {...limitesDoQuadrante(quadrante.corner, domain)}
                />
              ))}

              {/* Eixos centrais: hairline sólido, um passo fora da superfície. */}
              {showCrosshair ? (
                <ReferenceLine
                  className="stroke-border"
                  strokeWidth={1}
                  x={0}
                />
              ) : null}
              {showCrosshair ? (
                <ReferenceLine
                  className="stroke-border"
                  strokeWidth={1}
                  y={0}
                />
              ) : null}

              <Customized component={camadaDeFundo} />

              <Scatter
                data={points}
                isAnimationActive={false}
                shape={(formaProps: {
                  cx?: number;
                  cy?: number;
                  payload?: QuadrantChartPoint;
                }) => {
                  const { cx, cy, payload } = formaProps;
                  if (cx == null || cy == null || !payload) return <g />;

                  const tom = tomDe(payload);
                  const raio = raioDe(payload);
                  const destacado = tom === 'reference' || tom === 'selected';
                  const comum = {
                    fill: payload.color,
                    fillOpacity: OPACIDADE_POR_TOM[tom],
                    stroke: 'hsl(var(--card))',
                    strokeWidth: ANEL_DE_SUPERFICIE
                  };

                  return (
                    <g
                      className={cn(
                        'transition-opacity',
                        onSelect && 'cursor-pointer'
                      )}
                      onClick={
                        onSelect ? () => onSelect(payload.id) : undefined
                      }
                      onMouseEnter={() =>
                        definirHover({ point: payload, cx, cy })
                      }
                    >
                      {/* Alvo de ponteiro, maior que a marca e invisível. */}
                      <circle
                        cx={cx}
                        cy={cy}
                        fill="transparent"
                        r={Math.max(RAIO_DE_TOQUE, raio + ANEL_DE_SUPERFICIE)}
                      />
                      {destacado ? (
                        <circle
                          cx={cx}
                          cy={cy}
                          fill={payload.color}
                          fillOpacity={0.14}
                          r={raio + 7}
                        />
                      ) : null}
                      {payload.symbol === 'square' ? (
                        <rect
                          height={raio * 2}
                          rx={2}
                          width={raio * 2}
                          x={cx - raio}
                          y={cy - raio}
                          {...comum}
                        />
                      ) : (
                        <circle
                          cx={cx}
                          cy={cy}
                          r={raio}
                          {...comum}
                        />
                      )}
                    </g>
                  );
                }}
              />

              <Customized component={camadaDeFrente} />
            </ScatterChart>
          </ResponsiveContainer>

          {renderTooltip && hovered ? (
            <div
              className="pointer-events-none absolute z-20"
              style={{
                left: hovered.cx,
                top: hovered.cy,
                transform: 'translate(-50%, calc(-100% - 14px))'
              }}
            >
              {renderTooltip(hovered.point)}
            </div>
          ) : null}
        </div>
      </div>
    );
  }
);
QuadrantChart.displayName = 'QuadrantChart';

export { QuadrantChart };
