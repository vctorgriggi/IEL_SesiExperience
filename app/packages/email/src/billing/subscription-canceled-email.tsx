import {
  EmailCtaSection,
  EmailGreeting,
  EmailHero,
  EmailLayout,
  EmailParagraph,
  EmailSignature
} from '../templates/email-layout';

export type SubscriptionCanceledEmailProps = {
  appName: string;
  name: string;
  accessEndsAt?: string;
  reactivateLink?: string;
  dashboardLink: string;
};

export function SubscriptionCanceledEmail({
  appName,
  name,
  accessEndsAt,
  reactivateLink,
  dashboardLink
}: SubscriptionCanceledEmailProps) {
  return (
    <EmailLayout
      appName={appName}
      preview="Assinatura cancelada"
      footer={`Você recebe este email porque cancelou a assinatura no ${appName}.`}
    >
      <EmailHero
        appName={appName}
        headline="Assinatura cancelada"
      />

      <EmailGreeting name={name} />

      <EmailParagraph>
        Sua assinatura foi cancelada.
        {accessEndsAt ? ` Você segue com acesso até ${accessEndsAt}.` : ''}
      </EmailParagraph>

      {reactivateLink ? (
        <>
          <EmailParagraph>
            Quer voltar? Reative antes do fim do período atual.
          </EmailParagraph>
          <EmailCtaSection href={reactivateLink}>
            Reativar antes do fim
          </EmailCtaSection>
        </>
      ) : (
        <EmailCtaSection href={dashboardLink}>
          Acessar meu painel
        </EmailCtaSection>
      )}

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
