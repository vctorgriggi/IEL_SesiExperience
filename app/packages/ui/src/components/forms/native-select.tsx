'use client';

import { forwardRef, type SelectHTMLAttributes } from 'react';

import { cn } from '../../lib/utils';

export type NativeSelectProps = SelectHTMLAttributes<HTMLSelectElement> & {
  onValueChange?: (value: string) => void;
};

export const filterNativeSelectClass =
  'h-[var(--control-height-md)] w-full min-w-0 cursor-pointer appearance-none rounded-[var(--control-radius)] border border-border bg-background px-3 pr-10 text-sm text-foreground transition-colors focus:outline-none focus:ring-2 focus:ring-ring/40 disabled:cursor-not-allowed disabled:opacity-60';

export const NativeSelect = forwardRef<HTMLSelectElement, NativeSelectProps>(
  function NativeSelect(
    { className, children, value, onValueChange, disabled, ...props },
    ref
  ) {
    return (
      <select
        ref={ref}
        className={cn(
          'w-full cursor-pointer appearance-none rounded-[var(--control-radius)] border border-border bg-background px-3 pr-10 text-sm text-foreground transition-colors focus:outline-none focus:ring-2 focus:ring-ring/40 disabled:cursor-not-allowed disabled:opacity-60',
          className
        )}
        value={value}
        disabled={disabled}
        onChange={(e) => onValueChange?.(e.target.value)}
        {...props}
      >
        {children}
      </select>
    );
  }
);

NativeSelect.displayName = 'NativeSelect';

export const FilterNativeSelect = forwardRef<
  HTMLSelectElement,
  NativeSelectProps
>(function FilterNativeSelect({ className, ...props }, ref) {
  return (
    <NativeSelect
      ref={ref}
      className={cn(filterNativeSelectClass, className)}
      {...props}
    />
  );
});

FilterNativeSelect.displayName = 'FilterNativeSelect';
