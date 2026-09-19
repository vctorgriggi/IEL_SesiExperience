'use client';

import { cn } from '@workspace/ui';

type SuggestionChipsProps = {
  prompts: readonly string[];
  onSelect: (text: string) => void;
  disabled?: boolean;
  className?: string;
};

export function SuggestionChips({
  prompts,
  onSelect,
  disabled,
  className
}: SuggestionChipsProps) {
  return (
    <div
      className={cn('grid w-full grid-cols-1 gap-2 sm:grid-cols-2', className)}
    >
      {prompts.map((prompt) => (
        <button
          key={prompt}
          type="button"
          disabled={disabled}
          onClick={() => onSelect(prompt)}
          className={cn(
            'rounded-xl border border-border/70 bg-background px-4 py-3 text-left text-sm text-muted-foreground transition-colors',
            'hover:border-border hover:bg-muted/40 hover:text-foreground',
            'focus:outline-none focus:ring-2 focus:ring-ring focus:ring-offset-2',
            'disabled:pointer-events-none disabled:opacity-50'
          )}
        >
          {prompt}
        </button>
      ))}
    </div>
  );
}
