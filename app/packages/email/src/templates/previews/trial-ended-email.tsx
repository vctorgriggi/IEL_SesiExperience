import { TrialEndedEmail } from '../../billing/trial-ended-email';

export default function TrialEndedEmailPreview() {
  return (
    <TrialEndedEmail
      appName="Arki"
      name="João Silva"
      upgradeLink="https://example.com/billing/plans"
    />
  );
}
