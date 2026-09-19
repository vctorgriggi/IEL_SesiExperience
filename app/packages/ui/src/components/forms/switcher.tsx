'use client';

import type { KeyboardEvent } from 'react';
import { cn } from '../../lib/utils';

export type SwitcherOption<T extends string = string> = {
  label: string;
  value: T;
};

export type SwitcherProps<T extends string = string> = {
  options: readonly [SwitcherOption<T>, SwitcherOption<T>];
  value: T;
  onValueChange: (value: T) => void;
  disabled?: boolean;
  ariaLabel?: string;
  className?: string;
};

export function Switcher<T extends string = string>({
  options,
  value,
  onValueChange,
  disabled = false,
  ariaLabel = 'Alternar opção',
  className
}: SwitcherProps<T>) {
  const [left, right] = options;
  const isRight = value === right.value;

  const handleToggle = () => {
    if (disabled) return;
    onValueChange(isRight ? left.value : right.value);
  };

  const handleArrowNavigation = (event: KeyboardEvent<HTMLDivElement>) => {
    if (disabled) return;

    if (event.key === 'ArrowLeft') {
      event.preventDefault();
      onValueChange(left.value);
    }

    if (event.key === 'ArrowRight') {
      event.preventDefault();
      onValueChange(right.value);
    }
  };

  return (
    <div
      role="radiogroup"
      aria-label={ariaLabel}
      onKeyDown={handleArrowNavigation}
      className={cn(
        'relative inline-flex h-14 w-full max-w-[520px] items-center rounded-2xl border border-border/80 bg-card p-1.5 shadow-lg',
        disabled && 'cursor-not-allowed opacity-70',
        className
      )}
    >
      <span
        aria-hidden
        className={cn(
          'pointer-events-none absolute inset-y-1.5 left-1.5 w-[calc(50%-0.375rem)] rounded-xl bg-foreground shadow-sm transition-transform duration-300 ease-[cubic-bezier(.22,1,.36,1)]',
          isRight && 'translate-x-full'
        )}
      />

      <button
        type="button"
        role="radio"
        aria-checked={!isRight}
        disabled={disabled}
        onClick={() => onValueChange(left.value)}
        className={cn(
          'relative z-10 inline-flex h-full flex-1 items-center justify-center rounded-xl px-5 text-sm font-semibold tracking-tight transition-colors duration-200 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2',
          !isRight ? 'text-background' : 'text-muted-foreground hover:text-foreground'
        )}
      >
        {left.label}
      </button>

      <button
        type="button"
        role="switch"
        aria-checked={isRight}
        aria-label={ariaLabel}
        disabled={disabled}
        onClick={handleToggle}
        className="sr-only"
      >
        {ariaLabel}
      </button>

      <button
        type="button"
        role="radio"
        aria-checked={isRight}
        disabled={disabled}
        onClick={() => onValueChange(right.value)}
        className={cn(
          'relative z-10 inline-flex h-full flex-1 items-center justify-center rounded-xl px-5 text-sm font-semibold tracking-tight transition-colors duration-200 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2',
          isRight ? 'text-background' : 'text-muted-foreground hover:text-foreground'
        )}
      >
        {right.label}
      </button>
    </div>
  );
}
