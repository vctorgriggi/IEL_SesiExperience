'use client';

import {
  forwardRef,
  useId,
  useState,
  type InputHTMLAttributes,
  type ReactNode
} from 'react';

import { cn } from '../../lib/utils';

export type InputPasswordProps = Omit<
  InputHTMLAttributes<HTMLInputElement>,
  'size'
> & {
  label?: string;
  leftIcon?: ReactNode;
  error?: string;
  helperText?: string;
  inputClassName?: string;
  inputId?: string;
};

const InputPassword = forwardRef<HTMLInputElement, InputPasswordProps>(
  function InputPassword(
    {
      className,
      id,
      inputId,
      inputClassName,
      label,
      leftIcon,
      error,
      helperText,
      type,
      disabled,
      ...props
    },
    ref
  ) {
    const reactId = useId().replace(/:/g, '');
    const resolvedInputId = inputId ?? id ?? `input-password-${reactId}`;
    const hasError = !!error;
    const helpId = error || helperText ? `${resolvedInputId}-help` : undefined;
    const [visible, setVisible] = useState(type === 'text');

    const inputType = type === 'text' || visible ? 'text' : 'password';

    return (
      <div className={cn('space-y-2', className)}>
        {label ? (
          <label
            htmlFor={resolvedInputId}
            className="block text-sm font-medium leading-none text-foreground"
          >
            {label}
          </label>
        ) : null}

        <div className="relative">
          <input
            ref={ref}
            id={resolvedInputId}
            type={inputType}
            disabled={disabled}
            aria-invalid={hasError}
            aria-describedby={helpId}
            className={cn(
              'w-full rounded-(--control-radius) border bg-background px-3 py-2 text-sm text-foreground outline-none transition-colors',
              'border-input placeholder:text-muted-foreground focus-visible:ring-2 focus-visible:ring-ring/40',
              leftIcon && 'pl-10',
              'pr-10',
              hasError &&
                'border-destructive/60 focus-visible:ring-destructive/30',
              'disabled:cursor-not-allowed disabled:opacity-60',
              inputClassName
            )}
            {...props}
          />

          {leftIcon ? (
            <span className="pointer-events-none absolute left-3 top-1/2 z-1 -translate-y-1/2 text-muted-foreground">
              {leftIcon}
            </span>
          ) : null}

          <button
            type="button"
            disabled={disabled}
            aria-label={visible ? 'Ocultar senha' : 'Mostrar senha'}
            aria-pressed={visible}
            onClick={() => setVisible((current) => !current)}
            className={cn(
              'absolute right-1 top-1/2 inline-flex size-11 -translate-y-1/2 items-center justify-center rounded-md text-muted-foreground transition-colors hover:text-foreground',
              'focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring',
              'disabled:cursor-not-allowed disabled:opacity-50'
            )}
          >
            <svg
              aria-hidden="true"
              viewBox="0 0 20 20"
              className="size-4"
              fill="none"
              stroke="currentColor"
              strokeWidth="1.8"
            >
              {visible ? (
                <>
                  <path
                    d="m3 3 14 14"
                    strokeLinecap="round"
                    strokeLinejoin="round"
                  />
                  <path
                    d="M8.4 8.4a2.3 2.3 0 0 0 3.2 3.2"
                    strokeLinecap="round"
                    strokeLinejoin="round"
                  />
                  <path
                    d="M6.6 6.6A12.7 12.7 0 0 1 10 6c4.4 0 7.5 4 8 4.7a.5.5 0 0 1 0 .6 15.2 15.2 0 0 1-3.4 3.2"
                    strokeLinecap="round"
                    strokeLinejoin="round"
                  />
                  <path
                    d="M13.2 13.2A10.8 10.8 0 0 1 10 14c-4.4 0-7.5-4-8-4.7a.5.5 0 0 1 0-.6A15.2 15.2 0 0 1 5.3 5.5"
                    strokeLinecap="round"
                    strokeLinejoin="round"
                  />
                </>
              ) : (
                <>
                  <path
                    d="M2 10.3a.5.5 0 0 1 0-.6C2.5 9 5.6 5 10 5s7.5 4 8 4.7a.5.5 0 0 1 0 .6c-.5.7-3.6 4.7-8 4.7s-7.5-4-8-4.7Z"
                    strokeLinecap="round"
                    strokeLinejoin="round"
                  />
                  <circle
                    cx="10"
                    cy="10"
                    r="2.5"
                  />
                </>
              )}
            </svg>
          </button>
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
  }
);

InputPassword.displayName = 'InputPassword';

export { InputPassword };
