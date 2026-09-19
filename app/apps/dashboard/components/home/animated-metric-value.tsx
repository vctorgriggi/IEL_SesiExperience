'use client';

import { useEffect, useState } from 'react';
import NumberFlow from '@number-flow/react';

export type AnimatedMetricFormat = Omit<
  Intl.NumberFormatOptions,
  'notation'
> & {
  notation?: 'standard' | 'compact';
};

export type AnimatedMetricValueProps = {
  value: number;
  format?: AnimatedMetricFormat;
  locales?: Intl.LocalesArgument;
  suffix?: string;
  animateFromZeroOnMount?: boolean;
};

export function AnimatedMetricValue({
  value,
  format,
  locales = 'pt-BR',
  suffix = '',
  animateFromZeroOnMount = false
}: AnimatedMetricValueProps) {
  const [displayValue, setDisplayValue] = useState(
    animateFromZeroOnMount ? 0 : value
  );

  useEffect(() => {
    if (!animateFromZeroOnMount) {
      setDisplayValue(value);
      return;
    }
    const t = requestAnimationFrame(() => setDisplayValue(value));
    return () => cancelAnimationFrame(t);
  }, [value, animateFromZeroOnMount]);

  return (
    <NumberFlow
      value={displayValue}
      format={format}
      locales={locales}
      suffix={suffix}
      className="font-variant-numeric tabular-nums"
    />
  );
}
