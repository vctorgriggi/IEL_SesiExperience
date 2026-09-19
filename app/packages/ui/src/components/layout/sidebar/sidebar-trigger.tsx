'use client';

import { Cancel01Icon, Menu01Icon } from '@hugeicons/core-free-icons';
import { HugeiconsIcon } from '@hugeicons/react';

import { cn } from '../../../lib/utils';
import { Button } from '../../actions/button';

export type SidebarTriggerProps = {
  open: boolean;
  onToggle: () => void;
  openLabel?: string;
  closeLabel?: string;
  className?: string;
};

export function SidebarTrigger({
  open,
  onToggle,
  openLabel = 'Open menu',
  closeLabel = 'Close menu',
  className
}: SidebarTriggerProps) {
  return (
    <div
      data-sidebar-open={open ? 'true' : 'false'}
      className={cn(
        'relative z-[52] shrink-0 transition-transform duration-300 ease-out lg:hidden',
        open ? 'translate-x-[var(--sidebar-width)]' : 'translate-x-0',
        className
      )}
    >
      <Button
        className="size-10 rounded-full"
        aria-label={open ? closeLabel : openLabel}
        onClick={onToggle}
      >
        {open ? (
          <HugeiconsIcon
            icon={Cancel01Icon}
            size={20}
          />
        ) : (
          <HugeiconsIcon
            icon={Menu01Icon}
            size={20}
          />
        )}
      </Button>
    </div>
  );
}
