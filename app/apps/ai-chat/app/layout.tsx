import '@workspace/ui/styles/globals.css';

import type { PropsWithChildren } from 'react';
import type { Metadata, Viewport } from 'next';
import { Nunito } from 'next/font/google';

import { APP_NAME } from '@workspace/common/app';

import { Providers } from './providers';

export const viewport: Viewport = {
  width: 'device-width',
  initialScale: 1,
  minimumScale: 1,
  maximumScale: 1,
  themeColor: [
    { media: '(prefers-color-scheme: light)', color: 'white' },
    { media: '(prefers-color-scheme: dark)', color: 'black' }
  ]
};

export const metadata: Metadata = {
  title: `${APP_NAME} AI Chat`,
  description: 'Chat com IA da plataforma Arki Eventos.',
  icons: { icon: '/favicon.png' },
  robots: { index: false, follow: false }
};

const nunito = Nunito({
  subsets: ['latin', 'latin-ext'],
  variable: '--font-nunito'
});

export default function RootLayout({ children }: PropsWithChildren) {
  return (
    <html
      lang="pt-BR"
      suppressHydrationWarning
    >
      <body
        className={`${nunito.className} size-full min-h-screen bg-background text-foreground`}
      >
        <Providers>{children}</Providers>
      </body>
    </html>
  );
}
