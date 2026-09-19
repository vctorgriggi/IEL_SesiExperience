'use client';

import Link from 'next/link';
import { HugeiconsIcon } from '@hugeicons/react';

import { cn } from '@workspace/ui';

import type { SidebarNavItem } from './sidebar-config';
import { isNavItemActive } from './sidebar-config';

type SidebarNavLinkProps = {
  item: SidebarNavItem;
  pathname: string;
  onClose?: () => void;
};

const activeClasses =
  'bg-gradient-to-r from-[var(--color-sidebar-active-from)] to-[var(--color-sidebar-active-to)] text-primary';
const inactiveClasses =
  'text-muted-foreground hover:text-primary hover:bg-gradient-to-r hover:from-[var(--color-sidebar-active-from)] hover:to-[var(--color-sidebar-active-to)]';

export function SidebarNavLink({
  item,
  pathname,
  onClose
}: SidebarNavLinkProps) {
  const isActive = isNavItemActive(pathname, item);

  return (
    <Link
      href={item.href}
      onClick={onClose}
      className={cn(
        'flex items-center gap-2.5 px-3 py-2 rounded-2xl text-sm font-medium transition-colors',
        isActive ? activeClasses : inactiveClasses
      )}
    >
      <HugeiconsIcon
        icon={item.icon}
        size={18}
        className={cn('shrink-0', isActive && 'text-primary')}
      />
      {item.name}
    </Link>
  );
}
