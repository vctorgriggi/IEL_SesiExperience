import type { Metadata } from 'next';
import Link from 'next/link';

import { APP_NAME } from '@workspace/common/app';

import { env } from '../../env';

const baseUrl = env.NEXT_PUBLIC_MARKETING_URL;
const url = `${baseUrl}/contact`;

export const metadata: Metadata = {
  title: `Contato – ${APP_NAME}`,
  description: `Entre em contato com a equipe ${APP_NAME} para dúvidas, suporte ou parcerias.`,
  alternates: { canonical: '/contact' },
  robots: { index: true, follow: true },
  openGraph: {
    title: `Contato – ${APP_NAME}`,
    description: `Entre em contato com a equipe ${APP_NAME} para dúvidas, suporte ou parcerias.`,
    url,
    type: 'website'
  },
  twitter: {
    card: 'summary_large_image',
    title: `Contato – ${APP_NAME}`,
    description: `Entre em contato com a equipe ${APP_NAME} para dúvidas, suporte ou parcerias.`
  }
};

export default function ContactPage() {
  return (
    <article className="container mx-auto max-w-2xl px-4 py-16 lg:px-8 lg:py-24">
      <h1 className="text-3xl font-bold tracking-tight md:text-4xl">Contato</h1>
      <p className="mt-4 text-muted-foreground">
        Tem dúvidas sobre o {APP_NAME}, implementação, planos ou suporte? Envie
        um e-mail e retornaremos o mais breve possível.
      </p>

      <div className="mt-10 rounded-2xl border border-border bg-muted/30 p-8">
        <h2 className="text-lg font-semibold">E-mail</h2>
        <a
          href="mailto:hello@arki.dev"
          className="mt-2 inline-flex items-center gap-2 text-primary underline underline-offset-2 transition-colors hover:no-underline"
        >
          hello@arki.dev
        </a>
        <p className="mt-4 text-sm text-muted-foreground">
          Use este canal para questões comerciais, técnicas ou sobre sua conta.
        </p>
      </div>

      <p className="mt-8 text-sm text-muted-foreground">
        <Link
          href="/"
          className="text-primary underline underline-offset-2 hover:no-underline"
        >
          Voltar ao início
        </Link>
      </p>
    </article>
  );
}
