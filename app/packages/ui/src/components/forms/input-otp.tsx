'use client';

import {
  useCallback,
  useMemo,
  useRef,
  type ChangeEvent,
  type ClipboardEvent,
  type KeyboardEvent
} from 'react';

import { cn } from '../../lib/utils';

export type InputOTPProps = {
  value: string;
  onChange: (value: string) => void;
  length?: number;
  integerOnly?: boolean;
  disabled?: boolean;
  autoFocus?: boolean;
  className?: string;
  slotClassName?: string;
  'aria-label'?: string;
};

const sanitize = (raw: string, integerOnly: boolean): string =>
  integerOnly ? raw.replace(/\D/g, '') : raw;

export function InputOTP({
  value,
  onChange,
  length = 6,
  integerOnly = false,
  disabled = false,
  autoFocus = false,
  className,
  slotClassName,
  'aria-label': ariaLabel = 'Código de verificação'
}: InputOTPProps) {
  const inputsRef = useRef<Array<HTMLInputElement | null>>([]);
  const slots = useMemo(() => Array.from({ length }), [length]);

  const focusSlot = useCallback((index: number) => {
    const target = inputsRef.current[index];
    if (target) {
      target.focus();
      target.select();
    }
  }, []);

  const updateAt = useCallback(
    (index: number, char: string) => {
      const padded = value.padEnd(length, ' ').slice(0, length).split('');
      padded[index] = char || ' ';
      const next = padded.join('').replace(/\s+$/, '');
      onChange(next);
    },
    [value, length, onChange]
  );

  const handleChange = useCallback(
    (index: number) => (event: ChangeEvent<HTMLInputElement>) => {
      const raw = sanitize(event.target.value, integerOnly);
      if (!raw) {
        updateAt(index, '');
        return;
      }
      // Multi-char input (autofill / mobile suggestion) — fill subsequent slots.
      const chars = raw.split('').slice(0, length - index);
      const padded = value.padEnd(length, ' ').split('');
      chars.forEach((char, offset) => {
        padded[index + offset] = char;
      });
      const next = padded.join('').replace(/\s+$/, '').slice(0, length);
      onChange(next);
      const nextIndex = Math.min(index + chars.length, length - 1);
      focusSlot(nextIndex);
    },
    [integerOnly, length, value, onChange, updateAt, focusSlot]
  );

  const handleKeyDown = useCallback(
    (index: number) => (event: KeyboardEvent<HTMLInputElement>) => {
      if (event.key === 'Backspace') {
        if (value[index]) {
          updateAt(index, '');
          return;
        }
        if (index > 0) {
          event.preventDefault();
          updateAt(index - 1, '');
          focusSlot(index - 1);
        }
        return;
      }
      if (event.key === 'ArrowLeft' && index > 0) {
        event.preventDefault();
        focusSlot(index - 1);
        return;
      }
      if (event.key === 'ArrowRight' && index < length - 1) {
        event.preventDefault();
        focusSlot(index + 1);
      }
    },
    [value, length, updateAt, focusSlot]
  );

  const handlePaste = useCallback(
    (event: ClipboardEvent<HTMLInputElement>) => {
      event.preventDefault();
      const pasted = sanitize(event.clipboardData.getData('text'), integerOnly).slice(0, length);
      if (!pasted) return;
      onChange(pasted);
      focusSlot(Math.min(pasted.length, length - 1));
    },
    [integerOnly, length, onChange, focusSlot]
  );

  return (
    <div
      role="group"
      aria-label={ariaLabel}
      className={cn('flex items-center gap-2', className)}
    >
      {slots.map((_, index) => (
        <input
          key={index}
          ref={(element) => {
            inputsRef.current[index] = element;
          }}
          type="text"
          inputMode={integerOnly ? 'numeric' : 'text'}
          autoComplete="one-time-code"
          maxLength={1}
          value={value[index] ?? ''}
          disabled={disabled}
          autoFocus={autoFocus && index === 0}
          onChange={handleChange(index)}
          onKeyDown={handleKeyDown(index)}
          onPaste={handlePaste}
          onFocus={(event) => event.currentTarget.select()}
          aria-label={`${ariaLabel} dígito ${index + 1}`}
          className={cn(
            'size-10 rounded-md border border-input bg-background text-center font-mono text-lg text-foreground outline-none transition-colors',
            'focus-visible:border-ring focus-visible:ring-2 focus-visible:ring-ring/40',
            'disabled:cursor-not-allowed disabled:opacity-60',
            slotClassName
          )}
        />
      ))}
    </div>
  );
}
