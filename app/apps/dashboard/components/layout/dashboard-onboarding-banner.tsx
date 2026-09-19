'use client';

import { useState, type ReactNode } from 'react';
import { Cancel01Icon } from '@hugeicons/core-free-icons';
import { HugeiconsIcon } from '@hugeicons/react';

type DashboardOnboardingBannerProps = {
  empty: boolean;
  children: ReactNode;
};

export function DashboardOnboardingBanner({
  empty,
  children
}: DashboardOnboardingBannerProps) {
  const [dismissed, setDismissed] = useState(false);

  if (!empty || dismissed) return null;

  return (
    <div className="mb-10 relative">
      <button
        type="button"
        onClick={() => setDismissed(true)}
        aria-label="Close"
        className="absolute right-4 top-4 z-10 flex size-8 items-center justify-center rounded-full text-muted-foreground transition-colors hover:bg-muted hover:text-foreground focus:outline-none focus:ring-2 focus:ring-ring"
      >
        <HugeiconsIcon
          icon={Cancel01Icon}
          size={18}
        />
      </button>
      {children}
    </div>
  );
}
