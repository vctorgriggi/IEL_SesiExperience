'use client';

import { type HTMLAttributes } from 'react';

import { cn } from '../../lib/utils';

export type AlertVariant =
  | 'info'
  | 'destructive'
  | 'warning'
  | 'success'
  | 'default';

const variantClasses: Record<AlertVariant, string> = {
  destructive: 'border-destructive/30 bg-destructive/10 text-destructive',
  warning:
    'border-amber-500/30 bg-amber-500/10 text-amber-700 dark:text-amber-400',
  success:
    'border-green-500/30 bg-green-500/10 text-green-700 dark:text-green-400',
  info: 'border-blue-500/30 bg-blue-500/10 text-blue-700 dark:text-blue-400',
  default: 'border-border bg-muted text-muted-foreground'
};

export function Alert({
  className,
  variant = 'info',
  ...props
}: HTMLAttributes<HTMLDivElement> & { variant?: AlertVariant }) {
  return (
    <div
      role="alert"
      className={cn(
        'rounded-lg border px-4 py-3 text-sm',
        variantClasses[variant],
        className
      )}
      {...props}
    />
  );
}

export function AlertDescription({
  className,
  ...props
}: HTMLAttributes<HTMLParagraphElement>) {
  return (
    <p
      className={cn('text-sm', className)}
      {...props}
    />
  );
}
