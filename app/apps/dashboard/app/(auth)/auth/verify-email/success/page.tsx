import { type Metadata } from 'next';
import { VerifyEmailSuccessCard } from '@/components/auth/verify-email/verify-email-success-card';
import { createTitle } from '@/lib/formatters';

export const metadata: Metadata = {
  title: createTitle('Email verificado com sucesso')
};

export default async function EmailVerificationSuccessPage() {
  return <VerifyEmailSuccessCard />;
}
