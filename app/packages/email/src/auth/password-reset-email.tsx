import {
  EmailCtaSection,
  EmailFallbackLink,
  EmailGreeting,
  EmailHero,
  EmailLayout,
  EmailParagraph
} from '../templates/email-layout';

export type PasswordResetEmailProps = {
  appName: string;
  name: string | null;
  resetPasswordLink: string;
};

export function PasswordResetEmail({
  appName,
  name,
  resetPasswordLink
}: PasswordResetEmailProps) {
  return (
    <EmailLayout
      appName={appName}
      preview={`${appName} — redefinir sua senha`}
      footer="Se você não solicitou essa alteração, basta ignorar e excluir este email. Para manter sua conta segura, não encaminhe este email."
    >
      <EmailHero
        appName={appName}
        headline="Instruções para redefinir a senha"
      />

      {name ? (
        <EmailGreeting name={name} />
      ) : (
        <EmailParagraph>Olá,</EmailParagraph>
      )}

      <EmailParagraph>
        Alguém solicitou recentemente a alteração da senha da sua conta no{' '}
        {appName}. Se foi você, defina uma nova senha clicando no botão abaixo:
      </EmailParagraph>

      <EmailCtaSection href={resetPasswordLink}>
        Redefinir senha
      </EmailCtaSection>

      <EmailFallbackLink href={resetPasswordLink} />
    </EmailLayout>
  );
}
