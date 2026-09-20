import { redirect } from 'next/navigation';
import { getUserOrganizations } from '@/features/organizations/data/get-user-organizations';

import { routes } from '@workspace/routes';

/**
 * Entrada do painel do kit. Era a raiz `/` até o Mind RH assumir a raiz do
 * app: só resolve para onde a pessoa deve cair (primeira organização ou
 * onboarding) e nunca desenha nada.
 */
export default async function PainelPage() {
  const organizations = await getUserOrganizations();
  if (organizations.length === 0) {
    redirect(routes.dashboard.onboarding.index);
  }
  redirect(routes.dashboard.org(organizations[0].slug).home);
}
