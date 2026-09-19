'use client';

import { forwardRef, type HTMLAttributes, type ReactNode } from 'react';
import {
  PieChart,
  Pie,
  Cell,
  ResponsiveContainer,
  Tooltip,
} from 'recharts';
import { cva, type VariantProps } from 'class-variance-authority';

import { cn } from './lib/utils';

const donutChartVariants = cva('flex shrink-0', {
  variants: {
    size: {
      sm: 'h-32 w-32',
      default: 'h-48 w-48',
      lg: 'h-64 w-64',
      xl: 'h-80 w-80',
    },
  },
  defaultVariants: {
    size: 'default',
  },
});

export type DonutChartProps = HTMLAttributes<HTMLDivElement> &
  VariantProps<typeof donutChartVariants> & {
    data: Array<{
      label: string;
      value: number;
      color: string;
    }>;
    showLegend?: boolean;
    legendPosition?: 'right' | 'bottom';
    centerContent?: ReactNode;
    strokeWidth?: number;
    showLegendPercent?: boolean;
  };

const DonutChart = forwardRef<HTMLDivElement, DonutChartProps>(
  (
    {
      className,
      size,
      data,
      showLegend = true,
      legendPosition = 'right',
      centerContent,
      strokeWidth = 4,
      showLegendPercent = true,
      ...props
    },
    ref,
  ) => {
    const total = data.reduce((sum, item) => sum + item.value, 0);

    return (
      <div
        ref={ref}
        className={cn(
          'flex items-center gap-4',
          legendPosition === 'bottom' ? 'flex-col' : 'flex-row',
          className,
        )}
        {...props}
      >
        <div className={cn('relative', donutChartVariants({ size }))}>
          <ResponsiveContainer width="100%" height="100%">
            <PieChart>
              <Pie
                data={data}
                cx="50%"
                cy="50%"
                innerRadius="60%"
                outerRadius="100%"
                paddingAngle={0}
                dataKey="value"
                strokeWidth={strokeWidth}
              >
                {data.map((entry, index) => (
                  <Cell key={`cell-${index}`} fill={entry.color} />
                ))}
              </Pie>
              <Tooltip
                contentStyle={{
                  backgroundColor: 'hsl(var(--card))',
                  border: '1px solid hsl(var(--border))',
                  borderRadius: 'var(--radius)',
                }}
                formatter={(value: number, name: string, props: { payload?: { label?: string } }) => [
                  value,
                  props.payload?.label ?? name,
                ]}
              />
            </PieChart>
          </ResponsiveContainer>
          {centerContent && (
            <div className="absolute inset-0 flex items-center justify-center pointer-events-none">
              {centerContent}
            </div>
          )}
        </div>

        {showLegend && (
          <div
            className={cn(
              'space-y-2',
              legendPosition === 'bottom' ? 'w-full' : 'flex-1',
            )}
          >
            {data.map((segment, index) => (
              <div key={index} className="flex items-center gap-2">
                <div
                  className="w-3 h-3 rounded-full shrink-0"
                  style={{ backgroundColor: segment.color }}
                />
                <span className="text-sm text-muted-foreground">
                  {segment.label}
                </span>
                {showLegendPercent && (
                  <span className="text-sm font-medium ml-auto">
                    {total > 0
                      ? ((segment.value / total) * 100).toFixed(1)
                      : '0'}%
                  </span>
                )}
              </div>
            ))}
          </div>
        )}
      </div>
    );
  },
);
DonutChart.displayName = 'DonutChart';

export { DonutChart };
