import {
  EmailGreeting,
  EmailHero,
  EmailLayout,
  EmailParagraph
} from '../templates/email-layout';

export type ConnectedAccountSecurityAlertEmailProps = {
  appName: string;
  name: string;
  provider: string;
  action: 'connected' | 'disconnected';
};

export function ConnectedAccountSecurityAlertEmail({
  appName,
  name,
  provider,
  action
}: ConnectedAccountSecurityAlertEmailProps) {
  const actionText =
    action === 'disconnected' ? 'foi desconectado da' : 'foi conectado à';

  return (
    <EmailLayout
      appName={appName}
      preview="Alerta de segurança da sua conta"
      footer={`Você recebe este email porque houve alterações de segurança na sua conta no ${appName}.`}
    >
      <EmailHero
        appName={appName}
        headline="Alerta de segurança"
      />

      <EmailGreeting name={name} />

      <EmailParagraph style={{ marginBottom: 0 }}>
        O login com <strong>{provider}</strong> {actionText} sua conta.
      </EmailParagraph>
    </EmailLayout>
  );
}
