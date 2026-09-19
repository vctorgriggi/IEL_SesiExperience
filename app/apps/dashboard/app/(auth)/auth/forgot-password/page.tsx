import { type Metadata } from 'next';
import { ForgotPasswordCard } from '@/components/auth/forgot-password/forgot-password-card';
import { createTitle } from '@/lib/formatters';

export const metadata: Metadata = {
  title: createTitle('Esqueci minha senha')
};

export default function ForgotPasswordPage() {
  return <ForgotPasswordCard />;
}
