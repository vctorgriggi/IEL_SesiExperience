import type { ComponentProps, ReactNode } from 'react';
import { ArrowDown01Icon, ArrowUp01Icon } from '@hugeicons/core-free-icons';
import { HugeiconsIcon } from '@hugeicons/react';
import { cva, type VariantProps } from 'class-variance-authority';

import { cn } from '../../lib/utils';

const cardVariants = cva(
  'rounded-[var(--card-radius)] rounded-xl border border-border  bg-card p-6',
  {
    variants: {
      variant: {
        default: 'border-border',
        gradient:
          'border-primary/20 bg-gradient-to-br from-primary/5 to-primary/10',
        success:
          'border-success/20 bg-gradient-to-br from-success/5 to-success/10',
        warning:
          'border-warning/20 bg-gradient-to-br from-warning/5 to-warning/10',
        info: 'border-info/20 bg-gradient-to-br from-info/5 to-info/10'
      }
    },
    defaultVariants: {
      variant: 'default'
    }
  }
);

const VALUE_CLASSES =
  'text-3xl font-semibold tracking-tight text-display' as const;

export type MetricCardChange = {
  value: number;
  type: 'increase' | 'decrease';
  period?: string;
};

export type MetricCardProps = ComponentProps<'div'> &
  VariantProps<typeof cardVariants> & {
    title: string;
    value: ReactNode;
    change?: MetricCardChange;
    icon?: ReactNode;
  };

type MetricChangeBadgeProps = {
  change: MetricCardChange;
};

function MetricChangeBadge({ change }: MetricChangeBadgeProps) {
  const isPositive = change.type === 'increase';
  return (
    <span
      className={cn(
        'flex items-center gap-1 text-sm font-medium',
        isPositive ? 'text-success' : 'text-destructive'
      )}
    >
      <HugeiconsIcon
        icon={isPositive ? ArrowUp01Icon : ArrowDown01Icon}
        size={14}
      />
      {Math.abs(change.value)}%
    </span>
  );
}

export function MetricCard({
  className,
  variant,
  title,
  value,
  change,
  icon,
  ...props
}: MetricCardProps) {
  return (
    <div
      className={cn(cardVariants({ variant }), className)}
      {...props}
    >
      <div className="flex items-center gap-2 text-sm text-muted-foreground">
        {icon}
        <span className="font-medium">{title}</span>
      </div>

      <div className="mt-2 flex items-baseline gap-2">
        <span className={VALUE_CLASSES}>{value}</span>
        {change && <MetricChangeBadge change={change} />}
      </div>
    </div>
  );
}
