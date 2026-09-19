import { ReferralReportScreen } from '@/components/iel-demo/referrals/referral-report-screen';

type PageProps = {
  params: Promise<{ token: string }>;
};

/**
 * O relatório que a empresa abre depois de receber os currículos (S3).
 *
 * Sem login, como o link do colaborador: o caminho carrega só o token opaco
 * da vaga, e o que a página monta é o recorte do que já foi enviado àquela
 * empresa (PRODUTO.md §5.1).
 */
export default async function IelReferralReportPage({ params }: PageProps) {
  const { token } = await params;
  return <ReferralReportScreen token={token} />;
}
