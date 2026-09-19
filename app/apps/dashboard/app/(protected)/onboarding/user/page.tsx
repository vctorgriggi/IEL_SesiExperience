import { redirect } from 'next/navigation';

import { getAuthContext } from '@workspace/auth/context';
import { routes } from '@workspace/routes';

/**
 * Usuário que já tem memberships ou convites pendentes.
 * Redireciona para lista de organizações ou para o wizard de organização.
 */
export default async function OnboardingUserPage() {
  const { session } = await getAuthContext();

  const completedOnboarding = (
    session?.user as { completedOnboarding?: boolean } | undefined
  )?.completedOnboarding;
  if (!completedOnboarding) {
    redirect(routes.dashboard.onboarding.index);
  }

  redirect(routes.dashboard.index);
}
