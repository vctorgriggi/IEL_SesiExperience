import {
  EmailCtaSection,
  EmailFallbackLink,
  EmailGreeting,
  EmailHero,
  EmailLayout,
  EmailParagraph
} from '../templates/email-layout';

export type VerifyEmailAddressEmailProps = {
  appName: string;
  name: string;
  otp: string;
  verificationLink: string;
};

export function VerifyEmailAddressEmail({
  appName,
  name,
  verificationLink
}: VerifyEmailAddressEmailProps) {
  return (
    <EmailLayout
      appName={appName}
      preview="Verificação de email"
      footer="Se você não solicitou essa verificação, basta ignorar e excluir este email. Não encaminhe este email a terceiros."
    >
      <EmailHero
        appName={appName}
        headline="Verifique seu email"
      />

      <EmailGreeting name={name} />

      <EmailParagraph>
        Para concluir seu cadastro no {appName}, verifique seu endereço de email
        clicando no botão abaixo:
      </EmailParagraph>

      <EmailCtaSection href={verificationLink}>Verificar email</EmailCtaSection>

      <EmailFallbackLink href={verificationLink} />
      {/*<EmailParagraph style={{ marginBottom: 0 }}>
        Alternativamente, use esta senha de uso único na página de verificação:{' '}
        <strong>{otp}</strong>
      </EmailParagraph> */}
    </EmailLayout>
  );
}
