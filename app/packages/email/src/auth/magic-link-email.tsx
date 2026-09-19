import {
  EmailCtaSection,
  EmailFallbackLink,
  EmailHero,
  EmailLayout,
  EmailParagraph
} from '../templates/email-layout';

export type MagicLinkEmailProps = {
  appName: string;
  signInLink: string;
};

export function MagicLinkEmail({ appName, signInLink }: MagicLinkEmailProps) {
  return (
    <EmailLayout
      appName={appName}
      preview={`Entrar no ${appName}`}
      footer="Se não foi você que pediu este email, pode ignorar."
    >
      <EmailHero
        appName={appName}
        headline={`Entrar no ${appName}`}
      />

      <EmailParagraph>
        Clique no botão abaixo para entrar na sua conta. O link expira em 24
        horas.
      </EmailParagraph>

      <EmailCtaSection href={signInLink}>Entrar</EmailCtaSection>

      <EmailFallbackLink
        href={signInLink}
        label="Ou copie e cole no navegador:"
      />
    </EmailLayout>
  );
}
