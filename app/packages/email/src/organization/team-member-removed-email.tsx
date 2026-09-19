import {
  EmailCtaSection,
  EmailGreeting,
  EmailHero,
  EmailLayout,
  EmailParagraph,
  EmailSignature
} from '../templates/email-layout';

export type TeamMemberRemovedEmailProps = {
  appName: string;
  name: string;
  organizationName: string;
  dashboardLink?: string;
};

export function TeamMemberRemovedEmail({
  appName,
  name,
  organizationName,
  dashboardLink
}: TeamMemberRemovedEmailProps) {
  return (
    <EmailLayout
      appName={appName}
      preview={`Você saiu de ${organizationName}`}
      footer={`Você recebe este email porque foi removido da organização ${organizationName} no ${appName}.`}
    >
      <EmailHero
        appName={appName}
        headline={`Você saiu de ${organizationName}`}
      />

      <EmailGreeting name={name} />

      <EmailParagraph>
        Você não faz mais parte da organização{' '}
        <strong>{organizationName}</strong>. Se foi um engano, fale com um
        administrador. Caso queira criar sua própria organização ou entrar em
        outra, use o painel.
      </EmailParagraph>

      {dashboardLink ? (
        <EmailCtaSection href={dashboardLink}>
          Acessar meu painel
        </EmailCtaSection>
      ) : null}

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
