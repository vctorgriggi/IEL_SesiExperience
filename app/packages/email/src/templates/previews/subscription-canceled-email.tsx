import { SubscriptionCanceledEmail } from '../../billing/subscription-canceled-email';

export default function SubscriptionCanceledEmailPreview() {
  return (
    <SubscriptionCanceledEmail
      appName="Arki"
      name="João Silva"
      accessEndsAt="31/03/2026"
      reactivateLink="https://example.com/billing/reactivate"
      dashboardLink="https://example.com/dashboard"
    />
  );
}
