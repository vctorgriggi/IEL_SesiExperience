'use client';

import { forwardRef, type HTMLAttributes } from 'react';
import { cva, type VariantProps } from 'class-variance-authority';
import {
  PolarAngleAxis,
  PolarGrid,
  PolarRadiusAxis,
  Radar,
  RadarChart as RechartsRadarChart,
  ResponsiveContainer
} from 'recharts';

import { cn } from './lib/utils';

const radarChartVariants = cva('w-full min-h-0', {
  variants: {
    size: {
      sm: 'h-48 min-h-[192px]',
      default: 'h-64 min-h-[256px]',
      lg: 'h-80 min-h-[320px]'
    }
  },
  defaultVariants: {
    size: 'default'
  }
});

export type RadarChartSeries = {
  /** Chave do valor dentro de cada ponto de `data`. */
  key: string;
  label: string;
  color: string;
  fillOpacity?: number;
  strokeDasharray?: string;
};

/**
 * `null` num valor abre o polígono naquele eixo, de propósito: onde falta
 * medida não existe ponto, e o mínimo da escala desenharia um recuo que
 * ninguém mediu.
 */
export type RadarChartPoint = {
  /** Rótulo do eixo, exibido em volta do polígono. */
  axis: string;
} & Record<string, string | number | null>;

export type RadarChartProps = HTMLAttributes<HTMLDivElement> &
  VariantProps<typeof radarChartVariants> & {
    data: RadarChartPoint[];
    series: RadarChartSeries[];
    /** Extremos da escala. Fixos por quem usa: o gráfico não os infere. */
    domain?: [number, number];
    /** Raio do polígono dentro da área, em % — margem para os rótulos. */
    outerRadius?: string;
    gridStroke?: string;
    axisFill?: string;
  };

/**
 * Radar de dimensões.
 *
 * Deliberadamente sem tooltip e sem legenda embutida: o componente desenha a
 * forma, e quem o usa é responsável por dizer, em texto, o que a escala
 * significa. Uma escala ordinal sem essa explicação é lida como nota, que é
 * justamente o que não se quer aqui.
 */
const RadarChart = forwardRef<HTMLDivElement, RadarChartProps>(
  (
    {
      className,
      size,
      data,
      series,
      domain = [0, 3],
      outerRadius = '72%',
      gridStroke = 'hsl(var(--border))',
      axisFill = 'hsl(var(--muted-foreground))',
      ...props
    },
    ref
  ) => (
    <div
      ref={ref}
      className={cn(radarChartVariants({ size }), className)}
      {...props}
    >
      <ResponsiveContainer
        width="100%"
        height="100%"
      >
        <RechartsRadarChart
          data={data}
          outerRadius={outerRadius}
        >
          <PolarGrid stroke={gridStroke} />
          <PolarAngleAxis
            dataKey="axis"
            tick={{ fill: axisFill, fontSize: 11 }}
          />
          <PolarRadiusAxis
            domain={domain}
            tick={false}
            axisLine={false}
          />
          {series.map((entry) => (
            <Radar
              key={entry.key}
              name={entry.label}
              dataKey={entry.key}
              stroke={entry.color}
              strokeWidth={2}
              strokeDasharray={entry.strokeDasharray}
              fill={entry.color}
              fillOpacity={entry.fillOpacity ?? 0.12}
              /*
               * Eixo medido entre dois eixos sem medida não vira linha: a
               * série fica sem vizinho para ligar. O ponto é a única marca
               * que sobra, e sem ele o valor sumiria do gráfico.
               */
              dot={{ fill: entry.color, r: 3, strokeWidth: 0 }}
              isAnimationActive={false}
            />
          ))}
        </RechartsRadarChart>
      </ResponsiveContainer>
    </div>
  )
);
RadarChart.displayName = 'RadarChart';

export { RadarChart };
