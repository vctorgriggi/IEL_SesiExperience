'use client';

import { type ChangeEvent } from 'react';

import { cn } from '../../lib/utils';

export type DateTimePickerProps = {
  id?: string;
  value?: Date | null;
  onChange: (value: Date | null) => void;
  disabled?: boolean;
  placeholder?: string;
  error?: string;
  className?: string;
  inputClassName?: string;
};

const pad = (n: number) => String(n).padStart(2, '0');

function toLocalDateTimeString(date: Date): string {
  return `${date.getFullYear()}-${pad(date.getMonth() + 1)}-${pad(
    date.getDate()
  )}T${pad(date.getHours())}:${pad(date.getMinutes())}`;
}

function parseLocalDateTimeString(raw: string): Date | null {
  if (!raw) return null;
  const parsed = new Date(raw);
  return Number.isNaN(parsed.getTime()) ? null : parsed;
}

export function DateTimePicker({
  id,
  value,
  onChange,
  disabled,
  placeholder,
  error,
  className,
  inputClassName
}: DateTimePickerProps) {
  const stringValue = value ? toLocalDateTimeString(value) : '';

  const handleChange = (event: ChangeEvent<HTMLInputElement>) => {
    onChange(parseLocalDateTimeString(event.target.value));
  };

  return (
    <div className={cn('space-y-1.5', className)}>
      <input
        id={id}
        type="datetime-local"
        value={stringValue}
        onChange={handleChange}
        disabled={disabled}
        placeholder={placeholder}
        aria-invalid={!!error}
        className={cn(
          'h-9 w-full rounded-xl border border-border bg-background px-3 text-sm leading-5 text-foreground outline-none transition-colors',
          'placeholder:text-muted-foreground focus-visible:ring-2 focus-visible:ring-ring/30',
          'disabled:cursor-not-allowed disabled:opacity-60',
          error && 'border-destructive/60 focus-visible:ring-destructive/30',
          inputClassName
        )}
      />
      {error ? <p className="text-xs text-destructive">{error}</p> : null}
    </div>
  );
}
