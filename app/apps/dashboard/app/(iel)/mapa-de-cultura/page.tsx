import { redirect } from 'next/navigation';
import { ALL_COMPANIES } from '@/features/iel-demo/fixtures';

import { routes } from '@workspace/routes';

/**
 * Rota legada do mapa de cultura.
 *
 * O mapa virou aba da empresa em 19/09/2026: ele sempre mediu quem combina
 * com *uma* cultura, e a tela avulsa obrigava a escolher a empresa dentro
 * dela. A rota não some porque link velho na mão de alguém, no meio de uma
 * apresentação, não pode dar 404 — ela leva à mesma leitura, na empresa que
 * o panorama já abria por padrão.
 */
export default function IelCultureMapPage() {
  const primeira = ALL_COMPANIES[0]?.id;
  redirect(
    primeira
      ? routes.dashboard.iel.companies.cultureMapById(primeira)
      : routes.dashboard.iel.companies.index
  );
}
