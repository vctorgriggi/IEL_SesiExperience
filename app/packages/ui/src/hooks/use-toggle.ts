'use client';

import { useCallback, useState } from 'react';

/**
 * @param initialValue Estado inicial.
 */
export function useToggle(
  initialValue: boolean = false
): [boolean, () => void, (value: boolean) => void] {
  const [value, setValue] = useState(initialValue);

  const toggle = useCallback(() => {
    setValue((prev) => !prev);
  }, []);

  const setToggle = useCallback((newValue: boolean) => {
    setValue(newValue);
  }, []);

  return [value, toggle, setToggle];
}

/**
 * @param values Valores possíveis.
 * @param initialIndex Índice inicial.
 */
export function useToggleValues<T>(
  values: T[],
  initialIndex: number = 0
): [T, () => void, (value: T) => void] {
  const [currentIndex, setCurrentIndex] = useState(initialIndex);

  const toggle = useCallback(() => {
    setCurrentIndex((prev) => (prev + 1) % values.length);
  }, [values.length]);

  const setValue = useCallback(
    (value: T) => {
      const index = values.indexOf(value);
      if (index !== -1) {
        setCurrentIndex(index);
      }
    },
    [values]
  );

  return [values[currentIndex], toggle, setValue];
}
