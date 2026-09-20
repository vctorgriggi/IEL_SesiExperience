import type { Metadata } from 'next';
import { CultureInviteScreen } from '@/components/iel-demo/companies/culture-invite-screen';

export const metadata: Metadata = { title: 'Como é trabalhar aqui' };

type PageProps = {
  params: Promise<{ token: string }>;
};

/**
 * O link que o colaborador recebe (M2).
 *
 * O caminho carrega só o token opaco do convite: sem login, sem id de empresa
 * e sem dado pessoal na URL (PRODUTO.md §5.4).
 */
export default async function IelCultureInvitePage({ params }: PageProps) {
  const { token } = await params;
  return <CultureInviteScreen token={token} />;
}
