'use client';

import { forwardRef, useId, type SelectHTMLAttributes } from 'react';

import { cn } from '../../lib/utils';

export type SelectOption<T extends string | number = string> = {
  label: string;
  value: T;
  disabled?: boolean;
};

export type SelectProps<T extends string | number = string> = Omit<
  SelectHTMLAttributes<HTMLSelectElement>,
  'value' | 'onChange' | 'size'
> & {
  value: T | null | undefined;
  onChange: (value: T) => void;
  options: SelectOption<T>[] | readonly SelectOption<T>[];
  placeholder?: string;
  label?: string;
  error?: string;
  helperText?: string;
};

export const Select = forwardRef(function SelectInner<
  T extends string | number = string
>(
  {
    id,
    value,
    onChange,
    onBlur,
    options,
    placeholder,
    label,
    error,
    helperText,
    disabled,
    className,
    ...props
  }: SelectProps<T>,
  ref: React.ForwardedRef<HTMLSelectElement>
) {
  const reactId = useId().replace(/:/g, '');
  const selectId = id ?? `select-${reactId}`;
  const hasError = !!error;
  const helpId = error || helperText ? `${selectId}-help` : undefined;
  const selectedValue = value == null ? '' : String(value);

  return (
    <div className="space-y-2">
      {label ? (
        <label
          htmlFor={selectId}
          className="block text-sm font-medium leading-none text-foreground"
        >
          {label}
        </label>
      ) : null}

      <div className="group relative">
        <select
          ref={ref}
          id={selectId}
          value={selectedValue}
          disabled={disabled}
          onBlur={onBlur}
          onChange={(e) => {
            const next = [...options].find(
              (option) => String(option.value) === e.target.value
            );
            if (next) onChange(next.value);
          }}
          aria-invalid={hasError}
          aria-describedby={helpId}
          className={cn(
            'h-10 w-full cursor-pointer appearance-none rounded-xl border border-border bg-background pl-3 pr-10 text-sm text-foreground transition-colors focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring/40 disabled:cursor-not-allowed disabled:opacity-60',
            hasError &&
              'border-destructive/70 focus-visible:ring-destructive/30',
            className
          )}
          {...props}
        >
          {placeholder ? (
            <option
              value=""
              disabled
            >
              {placeholder}
            </option>
          ) : null}

          {[...options].map((option) => (
            <option
              key={String(option.value)}
              value={String(option.value)}
              disabled={option.disabled}
            >
              {option.label}
            </option>
          ))}
        </select>

        <span className="pointer-events-none absolute inset-y-0 right-3 flex items-center text-muted-foreground transition-colors group-focus-within:text-foreground">
          <svg
            aria-hidden="true"
            viewBox="0 0 20 20"
            className="size-4"
            fill="none"
            stroke="currentColor"
            strokeWidth="1.8"
          >
            <path
              d="M5 7.5 10 12.5 15 7.5"
              strokeLinecap="round"
              strokeLinejoin="round"
            />
          </svg>
        </span>
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
}) as <T extends string | number = string>(
  props: SelectProps<T> & React.RefAttributes<HTMLSelectElement>
) => React.ReactElement;
