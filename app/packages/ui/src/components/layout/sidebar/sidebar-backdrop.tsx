'use client';

import { cn } from '../../../lib/utils';

export type SidebarBackdropProps = {
  open: boolean;
  onClose?: () => void;
  className?: string;
};

export function SidebarBackdrop({
  open,
  onClose,
  className
}: SidebarBackdropProps) {
  return (
    <div
      role="button"
      tabIndex={-1}
      aria-hidden={!open}
      aria-label="Fechar menu"
      data-sidebar-backdrop-open={open ? 'true' : 'false'}
      onClick={onClose}
      onKeyDown={(e) => e.key === 'Escape' && onClose?.()}
      className={cn(
        'ui-sidebar-backdrop fixed inset-0 z-[50] transition-opacity duration-300 ease-out lg:hidden',
        open
          ? 'pointer-events-auto opacity-100'
          : 'pointer-events-none opacity-0',
        className
      )}
    />
  );
}
