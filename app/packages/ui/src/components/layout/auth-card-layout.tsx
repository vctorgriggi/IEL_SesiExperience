import type { ReactNode } from 'react';

import { cn } from '../../lib/utils';
import {
  Card,
  CardContent,
  CardDescription,
  CardFooter,
  CardHeader,
  CardTitle,
  type CardProps
} from './card';

export type AuthCardLayoutVariant = 'default' | 'centered';

const styles = {
  card: {
    base: 'animate-auth-fade-in rounded-xl border border-border/70 bg-background shadow-sm shadow-black/5 dark:shadow-black/20',
    default: 'w-full px-5 py-4',
    centered: 'mx-auto w-full px-6 py-8'
  },
  header: 'animate-auth-fade-in px-0 pb-4 text-center',
  title: 'text-2xl font-bold tracking-tight text-foreground sm:text-[2rem]',
  description: 'text-sm leading-6 text-muted-foreground sm:text-base',
  footer:
    'flex flex-wrap items-center justify-center gap-x-1.5 gap-y-1 text-sm text-muted-foreground'
} as const;

export type AuthCardLayoutProps = Omit<CardProps, 'variant'> & {
  title: ReactNode;
  description?: ReactNode;
  footer?: ReactNode;
  variant?: AuthCardLayoutVariant;
  children?: ReactNode;
  footerClassName?: string;
};

export function AuthCardLayout({
  title,
  description,
  footer,
  variant = 'default',
  children,
  className,
  footerClassName,
  ...cardProps
}: AuthCardLayoutProps) {
  return (
    <Card
      className={cn(styles.card.base, styles.card[variant], className)}
      {...cardProps}
    >
      <CardHeader className={styles.header}>
        <CardTitle className={styles.title}>{title}</CardTitle>
        {description != null && (
          <CardDescription className={styles.description}>
            {description}
          </CardDescription>
        )}
      </CardHeader>
      {children && <CardContent className="px-0 pb-0">{children}</CardContent>}
      {footer && (
        <CardFooter className={cn('px-0 pt-8', styles.footer, footerClassName)}>
          {footer}
        </CardFooter>
      )}
    </Card>
  );
}
