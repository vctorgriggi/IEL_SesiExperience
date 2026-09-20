import { redirect } from 'next/navigation';

import { routes } from '@workspace/routes';

/**
 * Rota legada da análise de aderência.
 *
 * A leitura por vaga saiu em 19/09/2026: ela repetia a mesa de seleção com
 * outra roupa, e a mesma conta rende mais ancorada na pessoa — "esta pessoa e
 * as empresas em que ela se encaixa", agora no perfil dela. Quem chega com
 * `?vaga=` vai para a mesa daquela vaga, que é onde o ranking da vaga mora;
 * sem vaga, para a lista de vagas. A rota fica de pé para link velho não dar
 * 404.
 */
type PageProps = {
  searchParams: Promise<{ vaga?: string }>;
};

export default async function IelAnaliseDeAderenciaPage({
  searchParams
}: PageProps) {
  const { vaga } = await searchParams;
  const iel = routes.dashboard.iel;
  redirect(vaga ? iel.jobs.byId(vaga).index : iel.jobs.index);
}
