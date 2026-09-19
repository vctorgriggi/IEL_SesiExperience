import '@workspace/ui/styles/globals.css';
import '../styles/globals.css';

import type { PropsWithChildren } from 'react';
import type { Metadata, Viewport } from 'next';
import { Manrope, Plus_Jakarta_Sans } from 'next/font/google';

import { APP_NAME } from '@workspace/common/app';

import { Footer } from '../components/footer';
import { Header } from '../components/header';
import { env } from '../env';
import { faqEntries } from '../lib/seo/faq-content';
import { buildStructuredDataScript } from '../lib/seo/structured-data';

const displayFont = Manrope({
  subsets: ['latin'],
  weight: ['600', '700', '800'],
  variable: '--font-marketing-display'
});

const bodyFont = Plus_Jakarta_Sans({
  subsets: ['latin'],
  weight: ['400', '500', '600'],
  variable: '--font-marketing-body'
});

const title = `${APP_NAME} - Template SaaS premium para Next.js`;
const description =
  'Template SaaS para Next.js com autenticação, billing e estrutura prontas para produção. Acelere o lançamento do seu produto.';

const structuredDataParams = {
  baseUrl: env.NEXT_PUBLIC_MARKETING_URL,
  name: APP_NAME,
  description
};

const jsonLd = buildStructuredDataScript(structuredDataParams, faqEntries);

export const viewport: Viewport = {
  width: 'device-width',
  initialScale: 1,
  themeColor: '#f7f5f2'
};

export const metadata: Metadata = {
  metadataBase: new URL(env.NEXT_PUBLIC_MARKETING_URL),
  applicationName: APP_NAME,
  title: {
    default: title,
    template: `%s | ${APP_NAME}`
  },
  description,
  keywords: [
    'template saas',
    'next.js saas',
    'starter kit saas',
    'auth billing multi-tenant',
    'boilerplate saas'
  ],
  category: 'technology',
  alternates: {
    canonical: '/',
    languages: {
      'pt-BR': '/'
    }
  },
  openGraph: {
    type: 'website',
    locale: 'pt_BR',
    siteName: APP_NAME,
    title,
    description,
    url: env.NEXT_PUBLIC_MARKETING_URL,
    images: [
      {
        url: '/og.png',
        width: 1200,
        height: 630,
        alt: `${APP_NAME} Template SaaS`
      }
    ]
  },
  twitter: {
    card: 'summary_large_image',
    title,
    description,
    images: ['/og.png']
  },
  robots: {
    index: true,
    follow: true,
    googleBot: {
      index: true,
      follow: true,
      'max-image-preview': 'large',
      'max-snippet': -1,
      'max-video-preview': -1
    }
  },
  formatDetection: {
    email: false,
    address: false,
    telephone: false
  },
  icons: { icon: '/favicon.png' }
};

export default function MarketingLayout({ children }: PropsWithChildren) {
  return (
    <html
      lang="pt-BR"
      className={`scroll-smooth ${displayFont.variable} ${bodyFont.variable}`}
      suppressHydrationWarning
      style={{
        fontFamily: 'var(--font-marketing-body), system-ui, sans-serif'
      }}
    >
      <head>
        <script
          type="application/ld+json"
          dangerouslySetInnerHTML={{ __html: jsonLd }}
        />
      </head>
      <body className="min-h-screen bg-background text-foreground antialiased">
        <Header />
        <main className="section-shell">{children}</main>
        <Footer />
      </body>
    </html>
  );
}
