'use client';

import { AnimatedMetricValue } from '@/components/home/animated-metric-value';

import { LineChart } from '@workspace/charts/line-chart';
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle
} from '@workspace/ui';

import type { ChartDataPoint } from './chart-utils';
import {
  formatChartDate,
  formatCurrency,
  formatCurrencyAxis
} from './chart-utils';

const CHART_COLORS = {
  series: 'hsl(var(--primary))',
  grid: 'hsl(var(--border))',
  axis: 'hsl(var(--muted-foreground))',
  dotStroke: 'hsl(var(--background))'
};

export type HomeChartRevenueProps = {
  data: ChartDataPoint[];
  periodLabel: string;
  totalInPeriod: number;
};

export function HomeChartRevenue({
  data,
  periodLabel,
  totalInPeriod
}: HomeChartRevenueProps) {
  const hasData = data.length > 0 && data.some((d) => d.value > 0);

  return (
    <Card className="rounded-xl shadow-none border border-border bg-card p-0 overflow-hidden">
      <CardHeader className="px-6 pt-4">
        <div className="flex items-center justify-between">
          <div>
            <CardDescription className="text-xs font-medium uppercase tracking-wider text-primary">
              Receita
            </CardDescription>
            <CardTitle className="mt-1 text-2xl font-bold tracking-tight">
              <AnimatedMetricValue
                value={totalInPeriod}
                format={{
                  style: 'currency',
                  currency: 'BRL',
                  minimumFractionDigits: 0,
                  maximumFractionDigits: 0
                }}
                animateFromZeroOnMount
              />
            </CardTitle>
          </div>
          <span className="inline-flex items-center gap-1.5 rounded-full bg-emerald-500/10 px-2.5 py-1 text-xs font-medium text-emerald-600 dark:text-emerald-400">
            <span className="h-1.5 w-1.5 rounded-full bg-emerald-500" />
            {periodLabel}
          </span>
        </div>
      </CardHeader>
      <CardContent className="px-0 pt-2 pb-1">
        {!hasData ? (
          <div className="flex h-[220px] items-center justify-center px-6">
            <p className="text-sm text-muted-foreground">
              Nenhuma receita no período
            </p>
          </div>
        ) : (
          <div className="h-[240px] min-h-[240px] w-full">
            <LineChart
              data={data}
              color={CHART_COLORS.series}
              gradientFrom={CHART_COLORS.series}
              gridStroke={CHART_COLORS.grid}
              axisFill={CHART_COLORS.axis}
              cursorStroke={CHART_COLORS.axis}
              activeDotStroke={CHART_COLORS.dotStroke}
              showGrid
              showAxis
              size="lg"
              className="h-full w-full"
              yAxisFormatter={formatCurrencyAxis}
              xAxisFormatter={formatChartDate}
              tooltipFormatter={formatCurrency}
            />
          </div>
        )}
      </CardContent>
    </Card>
  );
}
