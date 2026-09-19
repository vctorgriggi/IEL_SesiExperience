import type { Metadata } from 'next';

import { APP_NAME } from '@workspace/common/app';

import { env } from '../../env';

const baseUrl = env.NEXT_PUBLIC_MARKETING_URL;
const url = `${baseUrl}/privacy`;

export const metadata: Metadata = {
  title: `Política de privacidade – ${APP_NAME}`,
  description: `Política de privacidade e tratamento de dados do ${APP_NAME}.`,
  alternates: { canonical: '/privacy' },
  robots: { index: true, follow: true },
  openGraph: {
    title: `Política de privacidade – ${APP_NAME}`,
    description: `Política de privacidade e tratamento de dados do ${APP_NAME}.`,
    url,
    type: 'website'
  },
  twitter: {
    card: 'summary_large_image',
    title: `Política de privacidade – ${APP_NAME}`,
    description: `Política de privacidade e tratamento de dados do ${APP_NAME}.`
  }
};

export default function PrivacyPage() {
  return (
    <article className="container mx-auto max-w-3xl px-4 py-16 lg:px-8 lg:py-24">
      <h1 className="text-3xl font-bold tracking-tight md:text-4xl">
        Política de privacidade
      </h1>
      <p className="mt-2 text-sm text-muted-foreground">
        Última atualização: {new Date().toLocaleDateString('pt-BR')}
      </p>

      <div className="prose prose-neutral mt-10 dark:prose-invert">
        <section className="mt-8">
          <h2 className="text-xl font-semibold">1. Introdução</h2>
          <p className="mt-2 text-muted-foreground">
            Esta política descreve como o {APP_NAME} coleta, usa e protege suas
            informações. Ao utilizar nossos serviços, você concorda com os
            termos aqui descritos.
          </p>
        </section>

        <section className="mt-8">
          <h2 className="text-xl font-semibold">2. Dados que coletamos</h2>
          <p className="mt-2 text-muted-foreground">
            Podemos coletar dados de identificação (nome, e-mail), dados de uso
            (logs, interações com o produto) e dados técnicos necessários ao
            funcionamento do serviço. A coleta visa a prestação do serviço, a
            melhoria da experiência e o cumprimento de obrigações legais.
          </p>
        </section>

        <section className="mt-8">
          <h2 className="text-xl font-semibold">3. Uso dos dados</h2>
          <p className="mt-2 text-muted-foreground">
            Os dados são utilizados para fornecer e melhorar o serviço,
            comunicar atualizações, suporte e ofertas relevantes, e para cumprir
            obrigações legais. Não vendemos seus dados pessoais a terceiros.
          </p>
        </section>

        <section className="mt-8">
          <h2 className="text-xl font-semibold">4. Segurança e retenção</h2>
          <p className="mt-2 text-muted-foreground">
            Adotamos medidas técnicas e organizacionais para proteger seus
            dados. Os dados são mantidos pelo tempo necessário à prestação do
            serviço e ao cumprimento de obrigações legais.
          </p>
        </section>

        <section className="mt-8">
          <h2 className="text-xl font-semibold">5. Seus direitos</h2>
          <p className="mt-2 text-muted-foreground">
            Você pode solicitar acesso, correção, exclusão ou portabilidade dos
            seus dados, bem como revogar consentimentos ou apresentar reclamação
            à autoridade competente. Entre em contato pelo e-mail indicado no
            site.
          </p>
        </section>

        <section className="mt-8">
          <h2 className="text-xl font-semibold">6. Contato</h2>
          <p className="mt-2 text-muted-foreground">
            Dúvidas sobre esta política podem ser enviadas para o endereço de
            contato disponível no site.
          </p>
        </section>
      </div>
    </article>
  );
}
