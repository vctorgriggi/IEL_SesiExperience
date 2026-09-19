'use client';

import { type ChangeEvent, type InputHTMLAttributes } from 'react';

import { cn } from '../../lib/utils';

export type CalendarProps = Omit<
  InputHTMLAttributes<HTMLInputElement>,
  'value' | 'onChange' | 'type'
> & {
  value?: Date | string;
  onChange?: (date: Date | undefined) => void;
};

export function Calendar({
  value,
  onChange,
  className,
  ...props
}: CalendarProps) {
  const str =
    value instanceof Date ? value.toISOString().slice(0, 10) : (value ?? '');
  const handleChange = (e: ChangeEvent<HTMLInputElement>) => {
    onChange?.(e.target.value ? new Date(e.target.value) : undefined);
  };
  return (
    <input
      type="date"
      className={cn('input input-primary', className)}
      value={str}
      onChange={handleChange}
      {...props}
    />
  );
}
