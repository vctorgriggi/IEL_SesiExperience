'use client';

import { useEffect, useState } from 'react';

/**
 * @param query - Media query string (e.g. '(min-width: 768px)')
 */
export function useMediaQuery(
  query: string,
  defaultMatch: boolean = false
): boolean {
  const [matches, setMatches] = useState(defaultMatch);

  useEffect(() => {
    if (
      typeof window === 'undefined' ||
      typeof window.matchMedia !== 'function'
    ) {
      return;
    }

    const mediaQuery = window.matchMedia(query);
    setMatches(mediaQuery.matches);

    const listener = (event: MediaQueryListEvent) => {
      setMatches(event.matches);
    };
    mediaQuery.addEventListener('change', listener);
    return () => mediaQuery.removeEventListener('change', listener);
  }, [query]);

  return matches;
}
