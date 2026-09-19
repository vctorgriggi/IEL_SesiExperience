import { ConnectedAccountSecurityAlertEmail } from '../../account/connected-account-security-alert-email';

export default function ConnectedAccountSecurityAlertConnectedEmailPreview() {
  return (
    <ConnectedAccountSecurityAlertEmail
      action="connected"
      appName="Arki"
      name="João Silva"
      provider="Google"
    />
  );
}
