import { ConversaColaborador } from '@/components/iel-demo/chat/conversa-colaborador';

type PageProps = {
  params: Promise<{ token: string }>;
};

/**
 * "Como é trabalhar aqui?" em forma de conversa guiada (C2).
 *
 * O caminho carrega só o token opaco do convite: sem login, sem id de empresa
 * e sem dado pessoal na URL (PRODUTO.md §5.4).
 */
export default async function IelCultureInviteConversationPage({
  params
}: PageProps) {
  const { token } = await params;
  return <ConversaColaborador token={token} />;
}
