import {
  EmailCtaSection,
  EmailGreeting,
  EmailHero,
  EmailLayout,
  EmailParagraph,
  EmailSignature
} from '../templates/email-layout';

export type PaymentConfirmedEmailProps = {
  appName: string;
  name: string;
  dashboardLink: string;
};

export function PaymentConfirmedEmail({
  appName,
  name,
  dashboardLink
}: PaymentConfirmedEmailProps) {
  return (
    <EmailLayout
      appName={appName}
      preview="Pagamento confirmado"
      footer={`Você recebe este email porque sua assinatura no ${appName} foi atualizada.`}
    >
      <EmailHero
        appName={appName}
        headline="Pagamento confirmado"
      />

      <EmailGreeting name={name} />

      <EmailParagraph>
        Seu pagamento foi processado. Sua assinatura está ativa e você segue com
        acesso completo.
      </EmailParagraph>

      <EmailCtaSection href={dashboardLink}>Acessar meu painel</EmailCtaSection>

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
