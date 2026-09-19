import {
  EmailCtaSection,
  EmailFallbackLink,
  EmailGreeting,
  EmailHero,
  EmailLayout,
  EmailParagraph
} from '../templates/email-layout';

export type ConfirmEmailAddressChangeEmailProps = {
  appName: string;
  name: string;
  confirmLink: string;
};

export function ConfirmEmailAddressChangeEmail({
  appName,
  name,
  confirmLink
}: ConfirmEmailAddressChangeEmailProps) {
  return (
    <EmailLayout
      appName={appName}
      preview="Confirmar novo endereço de email"
      footer="Se você não solicitou essa alteração, basta ignorar e excluir este email. Para manter sua conta segura, não encaminhe este email."
    >
      <EmailHero
        appName={appName}
        headline="Confirmar novo endereço de email"
      />

      <EmailGreeting name={name} />

      <EmailParagraph>
        Para concluir a alteração do seu email no {appName}, confirme o novo
        endereço clicando no botão abaixo:
      </EmailParagraph>

      <EmailCtaSection href={confirmLink}>Confirmar novo email</EmailCtaSection>

      <EmailFallbackLink href={confirmLink} />
    </EmailLayout>
  );
}
