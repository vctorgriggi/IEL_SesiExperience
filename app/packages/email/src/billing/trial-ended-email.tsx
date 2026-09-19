import {
  EmailCtaSection,
  EmailGreeting,
  EmailHero,
  EmailLayout,
  EmailParagraph,
  EmailSignature
} from '../templates/email-layout';

export type TrialEndedEmailProps = {
  appName: string;
  name: string;
  upgradeLink: string;
};

export function TrialEndedEmail({
  appName,
  name,
  upgradeLink
}: TrialEndedEmailProps) {
  return (
    <EmailLayout
      appName={appName}
      preview="Seu trial acabou"
      footer={`Você recebe este email porque tinha um trial no ${appName}.`}
    >
      <EmailHero
        appName={appName}
        headline="Seu trial acabou"
      />

      <EmailGreeting name={name} />

      <EmailParagraph>
        Seu período de teste terminou. Para voltar a acessar tudo e continuar de
        onde parou, escolha um plano.
      </EmailParagraph>

      <EmailCtaSection href={upgradeLink}>Reativar agora</EmailCtaSection>

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
