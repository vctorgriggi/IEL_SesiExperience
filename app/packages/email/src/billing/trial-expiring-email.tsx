import {
  EmailCtaSection,
  EmailGreeting,
  EmailHero,
  EmailLayout,
  EmailParagraph,
  EmailSignature
} from '../templates/email-layout';

export type TrialExpiringEmailProps = {
  appName: string;
  name: string;
  upgradeLink: string;
  trialEndsAt: string;
};

export function TrialExpiringEmail({
  appName,
  name,
  upgradeLink,
  trialEndsAt
}: TrialExpiringEmailProps) {
  return (
    <EmailLayout
      appName={appName}
      preview="Seu trial acaba em 3 dias"
      footer={`Você recebe este email porque tem um trial ativo no ${appName}.`}
    >
      <EmailHero
        appName={appName}
        headline="Seu trial acaba em 3 dias"
      />

      <EmailGreeting name={name} />

      <EmailParagraph>
        Seu período de teste termina em {trialEndsAt}. Para seguir usando tudo
        sem interrupção, escolha um plano.
      </EmailParagraph>

      <EmailCtaSection href={upgradeLink}>Ver planos</EmailCtaSection>

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
