import type { Metadata } from 'next';

import { APP_NAME } from '@workspace/common/app';

import { env } from '../../env';

const baseUrl = env.NEXT_PUBLIC_MARKETING_URL;
const url = `${baseUrl}/terms`;

export const metadata: Metadata = {
  title: `Termos de uso – ${APP_NAME}`,
  description: `Termos de uso e condições do serviço ${APP_NAME}.`,
  alternates: { canonical: '/terms' },
  robots: { index: true, follow: true },
  openGraph: {
    title: `Termos de uso – ${APP_NAME}`,
    description: `Termos de uso e condições do serviço ${APP_NAME}.`,
    url,
    type: 'website'
  },
  twitter: {
    card: 'summary_large_image',
    title: `Termos de uso – ${APP_NAME}`,
    description: `Termos de uso e condições do serviço ${APP_NAME}.`
  }
};

export default function TermsPage() {
  return (
    <article className="container mx-auto max-w-3xl px-4 py-16 lg:px-8 lg:py-24">
      <h1 className="text-3xl font-bold tracking-tight md:text-4xl">
        Termos de uso
      </h1>
      <p className="mt-2 text-sm text-muted-foreground">
        Última atualização: {new Date().toLocaleDateString('pt-BR')}
      </p>

      <div className="prose prose-neutral mt-10 dark:prose-invert">
        <section className="mt-8">
          <h2 className="text-xl font-semibold">1. Aceite dos termos</h2>
          <p className="mt-2 text-muted-foreground">
            Ao acessar ou usar o {APP_NAME}, você concorda com estes termos. Se
            não concordar, não utilize o serviço.
          </p>
        </section>

        <section className="mt-8">
          <h2 className="text-xl font-semibold">2. Descrição do serviço</h2>
          <p className="mt-2 text-muted-foreground">
            O {APP_NAME} oferece uma base técnica (template/starter) para
            construção e operação de produtos SaaS. O uso inclui acesso a
            código, documentação e recursos descritos nos planos contratados.
          </p>
        </section>

        <section className="mt-8">
          <h2 className="text-xl font-semibold">3. Uso aceitável</h2>
          <p className="mt-2 text-muted-foreground">
            Você se compromete a utilizar o serviço de forma lícita, sem violar
            direitos de terceiros ou leis aplicáveis. É vedado uso para fins
            ilícitos, abusivos ou que comprometam a segurança ou disponibilidade
            do serviço.
          </p>
        </section>

        <section className="mt-8">
          <h2 className="text-xl font-semibold">4. Propriedade e licença</h2>
          <p className="mt-2 text-muted-foreground">
            A licença de uso do software é regida pelos termos do plano
            escolhido. Você mantém a propriedade dos dados e do conteúdo que
            inserir no produto que construir com a base.
          </p>
        </section>

        <section className="mt-8">
          <h2 className="text-xl font-semibold">
            5. Limitação de responsabilidade
          </h2>
          <p className="mt-2 text-muted-foreground">
            O serviço é fornecido &quot;como está&quot;, dentro dos limites da
            lei. Não nos responsabilizamos por danos indiretos, lucros cessantes
            ou decisões tomadas com base no uso do produto, salvo quando
            expressamente previsto em contrato ou lei.
          </p>
        </section>

        <section className="mt-8">
          <h2 className="text-xl font-semibold">6. Alterações e rescisão</h2>
          <p className="mt-2 text-muted-foreground">
            Podemos alterar estes termos com aviso prévio. O uso continuado após
            as alterações constitui aceite. Podemos suspender ou encerrar o
            acesso em caso de violação destes termos ou por decisão comercial.
          </p>
        </section>

        <section className="mt-8">
          <h2 className="text-xl font-semibold">7. Contato</h2>
          <p className="mt-2 text-muted-foreground">
            Para dúvidas sobre estes termos, utilize o canal de contato
            disponível no site.
          </p>
        </section>
      </div>
    </article>
  );
}
