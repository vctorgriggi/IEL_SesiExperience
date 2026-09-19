'use client';

import { forwardRef, type InputHTMLAttributes } from 'react';

import { cn } from '../../lib/utils';

export type CheckboxProps = Omit<
  InputHTMLAttributes<HTMLInputElement>,
  'type' | 'onChange'
> & {
  inputId?: string;
  onCheckedChange?: (checked: boolean) => void;
};

const Checkbox = forwardRef<HTMLInputElement, CheckboxProps>(function Checkbox(
  { className, checked, onCheckedChange, inputId, id, ...props },
  ref
) {
  return (
    <input
      ref={ref}
      type="checkbox"
      id={inputId ?? id}
      checked={checked}
      onChange={(event) => onCheckedChange?.(event.target.checked)}
      className={cn(
        'size-4 cursor-pointer rounded-sm border border-input bg-background text-primary outline-none transition-colors',
        'focus-visible:ring-2 focus-visible:ring-ring/40',
        'disabled:cursor-not-allowed disabled:opacity-60',
        className
      )}
      {...props}
    />
  );
});

Checkbox.displayName = 'Checkbox';

export { Checkbox };
