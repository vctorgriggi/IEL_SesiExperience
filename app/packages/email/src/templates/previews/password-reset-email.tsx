import { PasswordResetEmail } from '../../auth/password-reset-email';

export default function PasswordResetEmailPreview() {
  return (
    <PasswordResetEmail
      appName="Arki"
      name="João Silva"
      resetPasswordLink="https://example.com/reset-password/request/a5cffa7e-76eb-4671-a195-d1670a7d4df3"
    />
  );
}
