'use client';

import { forwardRef, useId, type TextareaHTMLAttributes } from 'react';

import { cn } from '../../lib/utils';

export type TextareaProps = TextareaHTMLAttributes<HTMLTextAreaElement> & {
  error?: string;
  helperText?: string;
};

const Textarea = forwardRef<HTMLTextAreaElement, TextareaProps>(
  function Textarea(
    { className, error, helperText, id, ...props },
    ref
  ) {
    const reactId = useId().replace(/:/g, '');
    const textareaId = id ?? `textarea-${reactId}`;
    const hasError = !!error;
    const helpId = error || helperText ? `${textareaId}-help` : undefined;

    return (
      <div className="space-y-2">
        <textarea
          ref={ref}
          id={textareaId}
          aria-invalid={hasError}
          aria-describedby={helpId}
          className={cn(
            'w-full min-h-20 resize-y rounded-(--control-radius) border bg-background px-3 py-2 text-sm text-foreground outline-none transition-colors',
            'border-input placeholder:text-muted-foreground focus-visible:ring-2 focus-visible:ring-ring/40',
            hasError && 'border-destructive/60 focus-visible:ring-destructive/30',
            'disabled:cursor-not-allowed disabled:opacity-60',
            className
          )}
          {...props}
        />
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

Textarea.displayName = 'Textarea';

export { Textarea };
