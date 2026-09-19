'use client';

import { useEffect, useState } from 'react';

/** Limita delay para evitar TimeoutNegativeWarning; retorna 0 se inválido/negativo. */
function clampDelay(delay: number): number {
  const n = Number(delay);
  return Number.isFinite(n) && n >= 0 ? n : 0;
}

/** Debounce de um valor. */
export function useDebounce<T>(value: T, delay: number): T {
  const [debouncedValue, setDebouncedValue] = useState<T>(value);

  useEffect(() => {
    const safeDelay = clampDelay(delay);
    const handler = setTimeout(() => {
      setDebouncedValue(value);
    }, safeDelay);

    return () => {
      clearTimeout(handler);
    };
  }, [value, delay]);

  return debouncedValue;
}

/** Debounce de um callback. */
export function useDebouncedCallback<TArgs extends unknown[], TReturn>(
  callback: (...args: TArgs) => TReturn,
  delay: number,
  _deps: React.DependencyList = []
): (...args: TArgs) => void {
  const [debounceTimer, setDebounceTimer] = useState<NodeJS.Timeout | null>(
    null
  );

  const debouncedCallback = (...args: TArgs) => {
    if (debounceTimer) {
      clearTimeout(debounceTimer);
    }

    const safeDelay = clampDelay(delay);
    const newTimer = setTimeout(() => {
      callback(...args);
    }, safeDelay);

    setDebounceTimer(newTimer);
  };

  useEffect(() => {
    return () => {
      if (debounceTimer) {
        clearTimeout(debounceTimer);
      }
    };
  }, [debounceTimer]);

  return debouncedCallback;
}
