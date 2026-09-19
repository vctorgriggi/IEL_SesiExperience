import type { HTMLAttributes } from 'react';

import { cn } from '../../lib/utils';

const variantMap = {
  default:
    'rounded-[var(--card-radius)] border border-border bg-card text-card-foreground shadow-sm',
  elevated:
    'rounded-[var(--card-radius)] border border-border bg-surface-elevated text-card-foreground shadow-md',
  outlined:
    'rounded-[var(--card-radius)] border-2 border-border-strong bg-card text-card-foreground shadow-none',
  filled:
    'rounded-[var(--card-radius)] border border-transparent bg-surface-muted text-card-foreground shadow-none'
} as const;

const paddingMap = {
  none: '',
  sm: 'p-[var(--card-padding-sm)]',
  default: 'p-[var(--card-padding-md)]',
  lg: 'p-[var(--card-padding-lg)]'
} as const;

export type CardProps = HTMLAttributes<HTMLDivElement> & {
  variant?: keyof typeof variantMap;
  padding?: keyof typeof paddingMap;
};

function Card({
  className,
  variant = 'default',
  padding = 'default',
  ...props
}: CardProps) {
  return (
    <div
      className={cn(
        'flex flex-col',
        variantMap[variant],
        paddingMap[padding],
        className
      )}
      {...props}
    />
  );
}

function CardHeader({ className, ...props }: HTMLAttributes<HTMLDivElement>) {
  return (
    <div
      className={cn('flex flex-col gap-1.5', className)}
      {...props}
    />
  );
}

function CardFooter({ className, ...props }: HTMLAttributes<HTMLDivElement>) {
  return (
    <div
      className={cn('flex items-center', className)}
      {...props}
    />
  );
}

function CardTitle({
  className,
  ...props
}: HTMLAttributes<HTMLHeadingElement>) {
  return (
    <h3
      className={cn(
        'text-foreground text-lg font-semibold leading-none tracking-tight',
        className
      )}
      {...props}
    />
  );
}

function CardDescription({
  className,
  ...props
}: HTMLAttributes<HTMLParagraphElement>) {
  return (
    <p
      className={cn('text-sm text-muted-foreground', className)}
      {...props}
    />
  );
}

function CardContent({ className, ...props }: HTMLAttributes<HTMLDivElement>) {
  return (
    <div
      className={cn('pt-0', className)}
      {...props}
    />
  );
}

export {
  Card,
  CardContent,
  CardDescription,
  CardFooter,
  CardHeader,
  CardTitle
};
