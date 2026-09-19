'use client';

import type { ReactNode } from 'react';
import { ThemeProvider } from 'next-themes';

import { ToastProvider } from '@workspace/ui';

import { env } from '../env';

export function Providers({ children }: { children: ReactNode }) {
  return (
    <ThemeProvider
      attribute="class"
      defaultTheme={env.NEXT_PUBLIC_THEME_MODE ?? 'light'}
      enableSystem
      storageKey="theme"
    >
      <ToastProvider>{children}</ToastProvider>
    </ThemeProvider>
  );
}
