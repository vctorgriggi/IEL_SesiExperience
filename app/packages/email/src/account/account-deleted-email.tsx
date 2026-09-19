import {
  EmailGreeting,
  EmailHero,
  EmailLayout,
  EmailParagraph,
  EmailSignature
} from '../templates/email-layout';

export type AccountDeletedEmailProps = {
  appName: string;
  name?: string;
};

export function AccountDeletedEmail({
  appName,
  name
}: AccountDeletedEmailProps) {
  return (
    <EmailLayout
      appName={appName}
      preview="Conta excluída"
      footer={`Você recebe este email porque solicitou a exclusão da conta no ${appName}.`}
    >
      <EmailHero
        appName={appName}
        headline="Conta excluída"
      />

      {name ? (
        <EmailGreeting name={name} />
      ) : (
        <EmailParagraph>Olá,</EmailParagraph>
      )}

      <EmailParagraph>
        Sua conta foi excluída. Seus dados foram removidos conforme solicitado.
      </EmailParagraph>

      <EmailParagraph>
        Se não foi você, responda este email o quanto antes.
      </EmailParagraph>

      <EmailSignature
        name="Time"
        role={appName}
      />
    </EmailLayout>
  );
}
