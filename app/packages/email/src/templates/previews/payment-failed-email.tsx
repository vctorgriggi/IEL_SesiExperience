import { PaymentFailedEmail } from '../../billing/payment-failed-email';

export default function PaymentFailedEmailPreview() {
  return (
    <PaymentFailedEmail
      appName="Arki"
      name="João Silva"
      billingPortalLink="https://example.com/billing/portal"
    />
  );
}
