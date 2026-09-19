import {
  EMAIL_APP_PRIMARY,
  EMAIL_APP_PRIMARY_FOREGROUND,
  EmailCtaSection,
  EmailFallbackLink,
  EmailHero,
  EmailInfoCard,
  EmailLayout,
  EmailParagraph,
  getThemedButtonStyle
} from '../templates/email-layout';

export type InvitationEmailProps = {
  appName: string;
  invitedByName: string;
  invitedByEmail: string;
  organizationName: string;
  inviteLink: string;
  themePrimaryColor?: string;
  themePrimaryForeground?: string;
};

export function InvitationEmail({
  appName,
  invitedByName,
  organizationName,
  inviteLink,
  themePrimaryColor = EMAIL_APP_PRIMARY,
  themePrimaryForeground = EMAIL_APP_PRIMARY_FOREGROUND
}: InvitationEmailProps) {
  const buttonStyle = getThemedButtonStyle(
    themePrimaryColor,
    themePrimaryForeground
  );

  return (
    <EmailLayout
      appName={appName}
      preview={`Participe de ${organizationName} no ${appName}`}
      footer="Se você não esperava este convite, pode ignorar este email."
      headerBackgroundColor={themePrimaryColor}
      headerTextColor={themePrimaryForeground}
    >
      <EmailHero
        appName={appName}
        headline={`Participe de ${organizationName} no ${appName}`}
        backgroundColor={themePrimaryColor}
        textColor={themePrimaryForeground}
      />

      <EmailParagraph>Olá,</EmailParagraph>
      <EmailParagraph style={{ marginBottom: 0 }}>
        Você foi convidado para fazer parte de uma organização no {appName}.
      </EmailParagraph>

      <EmailInfoCard
        rows={[
          {
            label: 'Quem convidou',
            content: (
              <>
                <strong>{invitedByName}</strong>
              </>
            )
          },
          {
            label: 'Organização',
            content: <strong>{organizationName}</strong>
          }
        ]}
      />

      <EmailParagraph style={{ marginTop: 0 }}>
        Clique no botão abaixo para aceitar o convite e entrar na organização.
      </EmailParagraph>

      <EmailCtaSection
        href={inviteLink}
        buttonStyle={buttonStyle}
      >
        Aceitar convite
      </EmailCtaSection>

      <EmailFallbackLink
        href={inviteLink}
        label="O botão não abre? Copie e cole o link no navegador:"
      />
    </EmailLayout>
  );
}
