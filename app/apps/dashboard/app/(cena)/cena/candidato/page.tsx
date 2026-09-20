import { redirect } from 'next/navigation';

import { routes } from '@workspace/routes';

/**
 * `/cena/candidato` sem id abre a cena do Jonas, o candidato da
 * demonstração (`CAND-21`, fixtures/candidatos-reais.ts): é o endereço
 * curto para digitar no telão.
 */
export default function CenaDoCandidatoPadraoPage() {
  redirect(routes.dashboard.iel.cenaCandidato('CAND-21'));
}
