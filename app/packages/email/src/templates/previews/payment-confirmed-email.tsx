import { PaymentConfirmedEmail } from '../../billing/payment-confirmed-email';

export default function PaymentConfirmedEmailPreview() {
  return (
    <PaymentConfirmedEmail
      appName="Arki"
      name="João Silva"
      dashboardLink="https://example.com/dashboard"
    />
  );
}
