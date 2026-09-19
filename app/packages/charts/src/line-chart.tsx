'use client';

import { forwardRef, useId, useMemo, useState, useEffect, type HTMLAttributes } from 'react';
import {
  Area,
  CartesianGrid,
  Tooltip,
  XAxis,
  YAxis,
  ResponsiveContainer,
  Line,
  ComposedChart,
  type TooltipProps
} from 'recharts';
import { cva, type VariantProps } from 'class-variance-authority';

import { cn } from './lib/utils';

const lineChartVariants = cva('w-full min-h-0', {
  variants: {
    size: {
      sm: 'h-32 min-h-[128px]',
      default: 'h-48 min-h-[192px]',
      lg: 'h-64 min-h-[256px]',
      xl: 'h-80 min-h-[320px]'
    }
  },
  defaultVariants: {
    size: 'default'
  }
});

export type LineChartDataPoint = {
  month: string;
  value: number;
  color?: string;
};

export type LineChartLine = {
  data: Array<{ month: string; value: number }>;
  color: string;
  strokeWidth?: number;
  strokeDasharray?: string;
  label?: string;
};

export type LineChartProps = HTMLAttributes<HTMLDivElement> &
  VariantProps<typeof lineChartVariants> & {
    data: LineChartDataPoint[];
    lines?: LineChartLine[];
    showGrid?: boolean;
    showAxis?: boolean;
    maxValue?: number;
    yTicks?: number[];
    color?: string;
    gradientFrom?: string;
    fallbackSeriesColor?: string;
    gridStroke?: string;
    axisFill?: string;
    /** Tooltip cursor line color (concrete). */
    cursorStroke?: string;
    /** Active dot ring color, e.g. background (concrete). */
    activeDotStroke?: string;
    tooltipFormatter?: (value: number) => string;
    yAxisFormatter?: (value: number) => string;
    xAxisFormatter?: (value: string) => string;
    unit?: string;
    legend?: string;
  };

function toConcreteColor(value: string | undefined, fallback: string | undefined): string {
  if (!value) return fallback ?? '';
  if (value.includes('var(')) return fallback ?? value;
  const trimmed = value.trim();
  const hslMatch = trimmed.match(/^hsl\s*\(\s*(\d+(?:\.\d+)?)\s+(\d+(?:\.\d+)?%)\s+(\d+(?:\.\d+)?%)\s*\)$/i);
  if (hslMatch) return `hsl(${hslMatch[1]}, ${hslMatch[2]}, ${hslMatch[3]})`;
  return trimmed;
}

function mergeChartData(
  main: LineChartDataPoint[],
  lines: LineChartLine[]
): Record<string, string | number>[] {
  const byMonth = new Map<string, Record<string, string | number>>();
  for (const p of main) {
    byMonth.set(p.month, { month: p.month, value: p.value });
  }
  lines.forEach((line, idx) => {
    const key = `line${idx}`;
    for (const p of line.data) {
      const existing = byMonth.get(p.month);
      if (existing) existing[key] = p.value;
      else byMonth.set(p.month, { month: p.month, [key]: p.value });
    }
  });
  return Array.from(byMonth.values()).sort((a, b) => {
    const order = main.map((d) => d.month);
    return order.indexOf(a.month as string) - order.indexOf(b.month as string);
  });
}

function CustomTooltip({
  active,
  payload,
  label,
  formatter,
  unit,
  xFormatter,
  color
}: TooltipProps<number, string> & {
  formatter?: (v: number) => string;
  unit?: string;
  xFormatter?: (v: string) => string;
  color?: string;
}) {
  if (!active || !payload?.length) return null;
  const val = payload[0]?.value as number;
  const formattedVal = formatter ? formatter(val) : val?.toLocaleString('pt-BR');
  const formattedLabel = xFormatter ? xFormatter(String(label)) : label;

  return (
    <div className="rounded-lg border border-border/60 bg-popover px-3.5 py-2.5 shadow-lg shadow-black/5">
      <p className="text-xs font-medium text-muted-foreground mb-1">
        {formattedLabel}
      </p>
      <div className="flex items-center gap-2">
        <span
          className="h-2.5 w-2.5 rounded-full shrink-0"
          style={{ backgroundColor: color }}
        />
        <span className="text-sm font-semibold text-foreground tabular-nums">
          {formattedVal}
          {unit ? <span className="text-muted-foreground font-normal ml-0.5">{unit}</span> : null}
        </span>
      </div>
    </div>
  );
}

const LineChart = forwardRef<HTMLDivElement, LineChartProps>(
  (
    {
      className,
      size,
      data,
      lines = [],
      showGrid = true,
      showAxis = true,
      maxValue,
      yTicks: yTicksProp,
      color,
      gradientFrom,
      fallbackSeriesColor,
      gridStroke,
      axisFill,
      cursorStroke,
      activeDotStroke,
      tooltipFormatter,
      yAxisFormatter,
      xAxisFormatter,
      unit,
      legend,
      ...props
    },
    ref
  ) => {
    const [mounted, setMounted] = useState(false);
    useEffect(() => setMounted(true), []);
    const gradientId = useId();
    const chartColor = toConcreteColor(color, fallbackSeriesColor ?? color);
    const fillColor = toConcreteColor(gradientFrom ?? color, fallbackSeriesColor ?? color);

    const mergedData = useMemo(
      () => mergeChartData(data, lines),
      [data, lines]
    );

    const allValues = useMemo(
      () =>
        mergedData.flatMap((d) => {
          const v = [d.value as number];
          lines.forEach((_, i) => {
            const l = d[`line${i}`];
            if (typeof l === 'number') v.push(l);
          });
          return v;
        }),
      [mergedData, lines]
    );

    const yMax = maxValue ?? (allValues.length ? Math.max(...allValues) : 100);
    const yMin = allValues.length ? Math.min(...allValues) : 0;

    const yTicks = useMemo(() => {
      if (yTicksProp) return yTicksProp;
      if (yMax === yMin) return [0, yMax || 1];
      const step = Math.ceil((yMax - yMin) / 4);
      const ticks: number[] = [];
      for (let i = yMin; i <= yMax + step; i += step) {
        ticks.push(i);
        if (ticks.length >= 5) break;
      }
      return ticks;
    }, [yTicksProp, yMax, yMin]);

    const domainMin = yTicksProp?.length ? Math.min(...yTicksProp) : Math.min(0, yMin);
    const domainMax = yTicksProp?.length ? Math.max(...yTicksProp) : yTicks[yTicks.length - 1] ?? yMax;

    const defaultYFormatter = (v: number) => {
      if (v >= 1000) return `${(v / 1000).toFixed(v >= 10000 ? 0 : 1)}k`;
      return String(v);
    };

    if (!mounted) {
      return (
        <div
          ref={ref}
          className={cn(lineChartVariants({ size }), className)}
          aria-hidden
          {...props}
        />
      );
    }

    return (
      <div
        ref={ref}
        className={cn(lineChartVariants({ size }), className)}
        {...props}
      >
        {legend && (
          <div className="flex items-center gap-2 mb-3">
            <span
              className="h-2 w-2 rounded-full"
              style={{ backgroundColor: chartColor }}
            />
            <span className="text-xs font-medium text-muted-foreground">
              {legend}
            </span>
          </div>
        )}
        <ResponsiveContainer width="100%" height="100%">
          <ComposedChart
            data={mergedData}
            margin={{ top: 8, right: 8, left: 4, bottom: 4 }}
          >
            <defs>
              <linearGradient
                id={gradientId}
                x1="0"
                y1="0"
                x2="0"
                y2="1"
              >
                <stop
                  offset="0%"
                  stopColor={fillColor}
                  stopOpacity={0.5}
                />
                <stop
                  offset="50%"
                  stopColor={fillColor}
                  stopOpacity={0.18}
                />
                <stop
                  offset="100%"
                  stopColor={fillColor}
                  stopOpacity={0.02}
                />
              </linearGradient>
            </defs>
            {showGrid && (
              <CartesianGrid
                strokeDasharray="none"
                stroke={gridStroke}
                vertical={false}
                opacity={0.4}
              />
            )}
            {showAxis && (
              <>
                <XAxis
                  dataKey="month"
                  axisLine={false}
                  tickLine={false}
                  tick={{
                    fontSize: 11,
                    fill: axisFill ?? undefined,
                    fontWeight: 500
                  }}
                  tickMargin={12}
                  tickFormatter={xAxisFormatter}
                  interval="preserveStartEnd"
                  minTickGap={30}
                />
                <YAxis
                  domain={[domainMin, domainMax]}
                  ticks={yTicks}
                  axisLine={false}
                  tickLine={false}
                  tick={{
                    fontSize: 11,
                    fill: axisFill ?? undefined,
                    fontWeight: 500
                  }}
                  tickMargin={8}
                  width={42}
                  tickFormatter={yAxisFormatter ?? defaultYFormatter}
                />
              </>
            )}
            <Tooltip
              cursor={
                cursorStroke !== undefined
                  ? {
                      stroke: cursorStroke,
                      strokeWidth: 1,
                      strokeDasharray: '4 4',
                      strokeOpacity: 0.4
                    }
                  : undefined
              }
              content={
                <CustomTooltip
                  formatter={tooltipFormatter}
                  unit={unit}
                  xFormatter={xAxisFormatter}
                  color={chartColor}
                />
              }
            />
            <Area
              type="monotone"
              dataKey="value"
              stroke="none"
              fill={`url(#${gradientId})`}
              isAnimationActive={true}
              animationDuration={800}
              animationEasing="ease-out"
            />
            <Line
              type="monotone"
              dataKey="value"
              stroke={chartColor}
              strokeWidth={3}
              dot={false}
              activeDot={{
                r: 6,
                fill: chartColor,
                stroke: activeDotStroke,
                strokeWidth: 2.5
              }}
              isAnimationActive={true}
              animationDuration={800}
              animationEasing="ease-out"
            />
            {lines.map((line, idx) => (
              <Line
                key={idx}
                type="monotone"
                dataKey={`line${idx}`}
                stroke={line.color}
                strokeWidth={line.strokeWidth ?? 1.5}
                strokeDasharray={line.strokeDasharray}
                dot={false}
                activeDot={{
                  r: 4,
                  fill: line.color,
                  stroke: activeDotStroke,
                  strokeWidth: 2
                }}
              />
            ))}
          </ComposedChart>
        </ResponsiveContainer>
      </div>
    );
  }
);
LineChart.displayName = 'LineChart';

export { LineChart };
