import type { ComponentProps, ReactNode } from 'react';
import { cva, type VariantProps } from 'class-variance-authority';

import { cn } from '../../lib/utils';

const cardMetricVariants = cva(
  'rounded-2xl border bg-card px-5 py-4 shadow-sm transition-colors',
  {
    variants: {
      tone: {
        default: 'border-border',
        success: 'border-emerald-300/50 bg-emerald-500/5',
        warning: 'border-amber-300/50 bg-amber-500/5',
        danger: 'border-destructive/35 bg-destructive/5',
        info: 'border-sky-300/50 bg-sky-500/5'
      }
    },
    defaultVariants: {
      tone: 'default'
    }
  }
);

export type CardMetricTrend = {
  value: string;
  tone?: 'positive' | 'negative' | 'neutral';
};

export type CardMetricProps = ComponentProps<'div'> &
  VariantProps<typeof cardMetricVariants> & {
    label: string;
    value: ReactNode;
    icon?: ReactNode;
    trend?: CardMetricTrend;
    helperText?: string;
  };

export function CardMetric({
  className,
  tone,
  label,
  value,
  icon,
  trend,
  helperText,
  ...props
}: CardMetricProps) {
  return (
    <div
      className={cn(cardMetricVariants({ tone }), className)}
      {...props}
    >
      <div className="flex items-center justify-between gap-3">
        <div className="min-w-0">
          <p className="truncate text-xs font-medium uppercase tracking-wide text-muted-foreground">
            {label}
          </p>
          <p className="mt-1 text-3xl font-semibold leading-none tracking-tight text-foreground">
            {value}
          </p>
        </div>
        {icon ? (
          <span className="inline-flex size-9 shrink-0 items-center justify-center rounded-xl border border-border/70 bg-background text-muted-foreground">
            {icon}
          </span>
        ) : null}
      </div>

      {trend || helperText ? (
        <div className="mt-3 flex items-center justify-between gap-2 text-xs">
          {trend ? (
            <span
              className={cn(
                'font-medium',
                trend.tone === 'positive' && 'text-emerald-600',
                trend.tone === 'negative' && 'text-destructive',
                (!trend.tone || trend.tone === 'neutral') &&
                  'text-muted-foreground'
              )}
            >
              {trend.value}
            </span>
          ) : (
            <span />
          )}

          {helperText ? (
            <span className="truncate text-muted-foreground">{helperText}</span>
          ) : null}
        </div>
      ) : null}
    </div>
  );
}
