'use client';

import { SidebarMobileTrigger } from '@/components/layout/sidebar';

import { ThemeToggle } from '@workspace/ui';

import { PageBreadcrumb, useBreadcrumb } from '@/components/layout/breadcrumb';

type ProtectedHeaderProps = {
  sidebarOpen: boolean;
  onSidebarToggle: () => void;
};

export function ProtectedHeader({
  sidebarOpen,
  onSidebarToggle
}: ProtectedHeaderProps) {
  const { items: breadcrumb } = useBreadcrumb();

  return (
    <header className="flex h-13 shrink-0 items-center justify-between px-4 gap-2 bg-background">
      <div className="flex min-w-0 flex-1 items-center gap-2 sm:gap-3 overflow-hidden">
        <div className="shrink-0 lg:hidden">
          <SidebarMobileTrigger
            open={sidebarOpen}
            onToggle={onSidebarToggle}
          />
        </div>
        {breadcrumb.length > 0 && (
          <div className="min-w-0 flex-1 overflow-hidden py-4 max-sm:hidden">
            <PageBreadcrumb items={breadcrumb} />
          </div>
        )}
      </div>
      <div className="flex shrink-0 items-center">
        <ThemeToggle />
      </div>
    </header>
  );
}
