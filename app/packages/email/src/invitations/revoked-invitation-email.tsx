import {
  EmailHero,
  EmailLayout,
  EmailParagraph
} from '../templates/email-layout';

export type RevokedInvitationEmailProps = {
  appName: string;
  organizationName: string;
};

export function RevokedInvitationEmail({
  appName,
  organizationName
}: RevokedInvitationEmailProps) {
  return (
    <EmailLayout
      appName={appName}
      preview={`Convite para ${organizationName} no ${appName} foi revogado`}
      footer="Se a revogação foi inesperada, peça a um administrador da organização para enviar um novo link de convite."
    >
      <EmailHero
        appName={appName}
        headline={`Convite para ${organizationName} foi revogado`}
      />

      <EmailParagraph>Olá,</EmailParagraph>
      <EmailParagraph style={{ marginBottom: 0 }}>
        Seu convite para participar de <strong>{organizationName}</strong> no{' '}
        <strong>{appName}</strong> foi revogado.
      </EmailParagraph>
    </EmailLayout>
  );
}
