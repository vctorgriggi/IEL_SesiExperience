'use client';

import { useCallback, useRef, type Ref } from 'react';

export function useCallbackRef<T>(callback: (value: T | null) => void): Ref<T> {
  const ref = useRef<T | null>(null);
  const callbackRef = useRef(callback);
  callbackRef.current = callback;

  return useCallback((value: T | null) => {
    ref.current = value;
    callbackRef.current(value);
  }, []);
}
