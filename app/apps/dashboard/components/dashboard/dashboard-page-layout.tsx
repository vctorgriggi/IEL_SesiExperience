import type { ReactNode } from 'react';
import { BreadcrumbSync } from '@/components/layout/breadcrumb';
import type { BreadcrumbItem } from '@/components/layout/breadcrumb';

import { cn } from '@workspace/ui';

type DashboardPageLayoutProps = {
  title: string;
  breadcrumb?: BreadcrumbItem[];
  showGreeting?: boolean;
  children: ReactNode;
  className?: string;
};

export function DashboardPageLayout({
  breadcrumb = [{ label: 'Início', href: '/', icon: 'home' }],
  children,
  className
}: DashboardPageLayoutProps) {
  return (
    <div className={cn('flex flex-col h-full', className)}>
      <BreadcrumbSync items={breadcrumb} />
      <div className="flex-1 min-h-0 overflow-auto pl-4 pb-4 pr-4 space-y-6">
        {children}
      </div>
    </div>
  );
}
