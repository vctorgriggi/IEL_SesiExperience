import { AuthShell } from '~/components/auth/auth-shell';
import { ForgotPasswordCard } from '~/components/auth/forgot-password-card';

export const metadata = { title: 'Recuperar senha' };

export default function ForgotPasswordPage() {
  return (
    <AuthShell>
      <ForgotPasswordCard />
    </AuthShell>
  );
}
