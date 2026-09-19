'use client';

import type { HTMLAttributes } from 'react';

import { cn } from '../../../lib/utils';

export type SidebarPanelProps = HTMLAttributes<HTMLElement> & {
  open?: boolean;
};

export function SidebarPanel({
  open = false,
  className,
  children,
  ...props
}: SidebarPanelProps) {
  return (
    <aside
      aria-hidden={!open}
      data-sidebar-open={open ? 'true' : 'false'}
      className={cn(
        'sidebar-panel w-[263px] sm:w-[220px] fixed inset-y-0 left-0 z-[50] flex h-screen flex-col border-r border-sidebar-border bg-sidebar text-sidebar-foreground',
        'transition-[transform,opacity] duration-300 ease-out',
        open
          ? 'translate-x-0 opacity-100'
          : 'max-lg:-translate-x-full max-lg:pointer-events-none max-lg:opacity-0 lg:translate-x-0 lg:opacity-100',
        className
      )}
      {...props}
    >
      {children}
    </aside>
  );
}
