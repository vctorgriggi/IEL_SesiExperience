import { type Metadata } from 'next';
import { MagicLinkCheckEmailCard } from '@/components/auth/magic-link/magic-link-check-email-card';
import { createTitle } from '@/lib/formatters';

export const metadata: Metadata = {
  title: createTitle('Verifique seu email')
};

export default async function MagicLinkPage() {
  return <MagicLinkCheckEmailCard />;
}
