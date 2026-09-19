'use client';

import {
  forwardRef,
  useId,
  type InputHTMLAttributes,
  type ReactNode
} from 'react';

import { cn } from '../../lib/utils';

export type InputProps = Omit<InputHTMLAttributes<HTMLInputElement>, 'size'> & {
  label?: string;
  floatingLabel?: string;
  leftIcon?: ReactNode;
  rightIcon?: ReactNode;
  error?: string;
  helperText?: string;
};

const Input = forwardRef<HTMLInputElement, InputProps>(function Input(
  {
    className,
    label,
    floatingLabel,
    leftIcon,
    rightIcon,
    error,
    helperText,
    id,
    ...props
  },
  ref
) {
  const reactId = useId().replace(/:/g, '');
  const inputId = id ?? `input-${reactId}`;
  const hasError = !!error;
  const helpId = error || helperText ? `${inputId}-help` : undefined;

  return (
    <div className="space-y-2">
      {(label || floatingLabel) && (
        <label
          htmlFor={inputId}
          className="block text-sm font-medium leading-none text-foreground"
        >
          {label ?? floatingLabel}
        </label>
      )}
      <div className="relative">
        <input
          ref={ref}
          id={inputId}
          aria-invalid={hasError}
          aria-describedby={helpId}
          className={cn(
            'w-full rounded-(--control-radius) border bg-background px-3 py-2 text-sm text-foreground outline-none transition-colors',
            'border-input placeholder:text-muted-foreground focus-visible:ring-2 focus-visible:ring-ring/40',
            leftIcon && 'pl-10',
            rightIcon && 'pr-10',
            hasError &&
              'border-destructive/60 focus-visible:ring-destructive/30',
            'disabled:cursor-not-allowed disabled:opacity-60',
            className
          )}
          {...props}
        />
        {leftIcon && (
          <span className="pointer-events-none absolute left-3 top-1/2 -translate-y-1/2 text-muted-foreground">
            {leftIcon}
          </span>
        )}
        {rightIcon && (
          <span className="pointer-events-none absolute right-3 top-1/2 -translate-y-1/2 text-muted-foreground">
            {rightIcon}
          </span>
        )}
      </div>
      {(error || helperText) && (
        <p
          id={helpId}
          className={cn(
            'text-sm',
            error ? 'text-destructive' : 'text-muted-foreground'
          )}
        >
          {error ?? helperText}
        </p>
      )}
    </div>
  );
});

Input.displayName = 'Input';

export { Input };
