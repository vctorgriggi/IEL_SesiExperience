'use client';

import { useCallback, useEffect } from 'react';
import { usePathname } from 'next/navigation';
import { trackEvent } from '../run';

export function useTrackEvent(): (name: string, properties?: Record<string, unknown>) => void {
  return useCallback((name: string, properties?: Record<string, unknown>) => {
    trackEvent(name, properties);
  }, []);
}

export function usePageView(): void {
  const pathname = usePathname();

  useEffect(() => {
    if (pathname) {
      trackEvent('$pageview', { path: pathname });
    }
  }, [pathname]);
}
