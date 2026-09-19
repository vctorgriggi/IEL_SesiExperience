'use client';

import { forwardRef, type InputHTMLAttributes } from 'react';

import { cn } from '../../lib/utils';

export type SwitchProps = Omit<
  InputHTMLAttributes<HTMLInputElement>,
  'onChange' | 'type'
> & {
  onCheckedChange?: (checked: boolean) => void;
};

/** Toggle acessível em Tailwind nativo (sem dependência de UI kit externo). */
export const Switch = forwardRef<HTMLInputElement, SwitchProps>(function Switch(
  { checked, onCheckedChange, className, disabled, ...props },
  ref
) {
  return (
    <label
      className={cn(
        'relative inline-flex h-6 w-11 shrink-0 cursor-pointer items-center rounded-full transition-colors focus-within:ring-2 focus-within:ring-ring/40',
        checked ? 'bg-primary' : 'bg-input',
        disabled && 'cursor-not-allowed opacity-50',
        className
      )}
    >
      <input
        ref={ref}
        type="checkbox"
        role="switch"
        className="peer sr-only"
        checked={checked}
        disabled={disabled}
        onChange={(e) => onCheckedChange?.(e.target.checked)}
        {...props}
      />
      <span
        aria-hidden="true"
        className={cn(
          // A bolinha usa o token de contraste do trilho: ligado ela fica sobre
          // `primary`, desligado sobre `input`.
          'pointer-events-none inline-block size-5 rounded-full shadow transition-transform',
          checked ? 'bg-primary-foreground' : 'bg-background',
          checked ? 'translate-x-[1.375rem]' : 'translate-x-0.5'
        )}
      />
    </label>
  );
});
