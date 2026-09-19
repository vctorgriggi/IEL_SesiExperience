'use client';

import { useEffect, useId, useState } from 'react';
import { useTheme } from 'next-themes';

import { cn } from '@workspace/ui';

const OPTIONS = [
  { value: 'light', label: 'Claro' },
  { value: 'dark', label: 'Escuro' },
  { value: 'system', label: 'Do sistema' }
] as const;

export function ThemePreference() {
  const { theme, setTheme } = useTheme();
  const [mounted, setMounted] = useState(false);
  const groupId = useId();

  useEffect(() => setMounted(true), []);

  return (
    <fieldset className="flex flex-col gap-2 border-0 p-0">
      <legend className="mb-2 text-sm font-medium text-foreground">
        Aparência
      </legend>
      <div className="flex flex-wrap gap-2">
        {OPTIONS.map((option) => {
          const id = `${groupId}-${option.value}`;
          const active = mounted && theme === option.value;
          return (
            <div
              key={option.value}
              className="relative"
            >
              <input
                id={id}
                type="radio"
                name={`${groupId}-tema`}
                value={option.value}
                checked={active}
                onChange={() => setTheme(option.value)}
                className="peer sr-only"
              />
              <label
                htmlFor={id}
                className={cn(
                  'flex h-11 cursor-pointer items-center rounded-md border border-border px-4 text-sm text-muted-foreground transition-colors hover:bg-muted',
                  'peer-focus-visible:ring-2 peer-focus-visible:ring-ring peer-focus-visible:ring-offset-2',
                  'peer-checked:border-primary peer-checked:bg-primary/10 peer-checked:font-medium peer-checked:text-foreground'
                )}
              >
                {option.label}
              </label>
            </div>
          );
        })}
      </div>
    </fieldset>
  );
}
