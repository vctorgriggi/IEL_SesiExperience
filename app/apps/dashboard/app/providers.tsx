'use client';

import { AnalyticsInit } from '@/components/analytics/analytics-init';
import { CreateOrganizationModalProvider } from '@/components/onboarding/create-organization-modal';
import { ThemeProvider } from 'next-themes';
import NextTopLoader from 'nextjs-toploader';

import { ModalProvider, ToastProvider } from '@workspace/ui';

import { env } from '../env';

const themeConfig = {
  attribute: 'class' as const,
  defaultTheme: env.NEXT_PUBLIC_THEME_MODE ?? 'light',
  enableSystem: true,
  storageKey: 'theme'
};

export function Providers({ children }: { children: React.ReactNode }) {
  return (
    <ThemeProvider {...themeConfig}>
      <NextTopLoader
        height={3}
        showSpinner={true}
        color="#f59e0b"
        showForHashAnchor={false}
      />
      <ToastProvider>
        <CreateOrganizationModalProvider>
          <ModalProvider>
            <AnalyticsInit />
            {children}
          </ModalProvider>
        </CreateOrganizationModalProvider>
      </ToastProvider>
    </ThemeProvider>
  );
}
