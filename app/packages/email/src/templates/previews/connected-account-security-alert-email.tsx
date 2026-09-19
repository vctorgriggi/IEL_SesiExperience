import { ConnectedAccountSecurityAlertEmail } from '../../account/connected-account-security-alert-email';

export default function ConnectedAccountSecurityAlertEmailPreview() {
  return (
    <ConnectedAccountSecurityAlertEmail
      action="disconnected"
      appName="Arki"
      name="João Silva"
      provider="Google"
    />
  );
}
