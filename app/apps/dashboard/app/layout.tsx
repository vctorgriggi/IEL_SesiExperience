import '@workspace/ui/styles/globals.css';

import type { PropsWithChildren } from 'react';
import type { Metadata, Viewport } from 'next';
import { Nunito } from 'next/font/google';
import { env } from '@/env';

import { APP_DESCRIPTION, APP_NAME } from '@workspace/common/app';

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
  metadataBase: new URL(env.NEXT_PUBLIC_DASHBOARD_URL),
  title: APP_NAME,
  description: APP_DESCRIPTION,
  icons: {
    icon: '/favicon.png'
  },
  openGraph: {
    type: 'website',
    locale: 'pt_BR',
    siteName: APP_NAME,
    title: APP_NAME,
    description: APP_DESCRIPTION,
    url: env.NEXT_PUBLIC_DASHBOARD_URL,
    images: {
      url: `${env.NEXT_PUBLIC_DASHBOARD_URL}/og-image`,
      width: 1200,
      height: 630,
      alt: APP_NAME
    }
  },
  robots: {
    index: true,
    follow: true
  }
};

const nunito = Nunito({
  subsets: ['latin', 'latin-ext'],
  variable: '--font-nunito'
});

export default async function RootLayout({ children }: PropsWithChildren) {
  return (
    <html
      lang="pt-BR"
      className={`${nunito.variable} size-full min-h-screen overflow-x-hidden`}
      suppressHydrationWarning
    >
      <body className={`${nunito.className} size-full overflow-x-hidden`}>
        <Providers>{children}</Providers>
      </body>
    </html>
  );
}
