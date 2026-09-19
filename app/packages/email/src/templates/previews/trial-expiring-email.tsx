import { TrialExpiringEmail } from '../../billing/trial-expiring-email';

export default function TrialExpiringEmailPreview() {
  return (
    <TrialExpiringEmail
      appName="Arki"
      name="João Silva"
      trialEndsAt="12/03/2026"
      upgradeLink="https://example.com/billing/plans"
    />
  );
}
