import { VerifyEmailAddressEmail } from '../../auth/verify-email-address-email';

export default function VerifyEmailAddressEmailPreview() {
  return (
    <VerifyEmailAddressEmail
      appName="Arki"
      name="João Silva"
      otp="123456"
      verificationLink="https://example.com/verify-email/request/bcab80ca8eb6ee41d4e7e34bb157a0e205ab3188a78599137b76d883e86e7036"
    />
  );
}
