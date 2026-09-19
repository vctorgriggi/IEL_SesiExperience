import {
  EmailCtaSection,
  EmailGreeting,
  EmailHero,
  EmailLayout,
  EmailParagraph,
  EmailSignature
} from '../templates/email-layout';

export type PaymentFailedEmailProps = {
  appName: string;
  name: string;
  billingPortalLink: string;
};

export function PaymentFailedEmail({
  appName,
  name,
  billingPortalLink
}: PaymentFailedEmailProps) {
  return (
    <EmailLayout
      appName={appName}
      preview="Problema na cobrança"
      footer={`Você recebe este email porque há um problema de cobrança na sua conta no ${appName}.`}
    >
      <EmailHero
        appName={appName}
        headline="Cobrança não processada"
      />

      <EmailGreeting name={name} />

      <EmailParagraph>
        Não conseguimos processar o pagamento da sua assinatura. Para evitar
        interrupção no acesso, atualize a forma de pagamento.
      </EmailParagraph>

      <EmailCtaSection href={billingPortalLink}>
        Atualizar forma de pagamento
      </EmailCtaSection>

      <EmailParagraph>
        Se precisar de ajuda, responda este email.
      </EmailParagraph>

      <EmailSignature
        name="Time"
        role={appName}
      />
    </EmailLayout>
  );
}
