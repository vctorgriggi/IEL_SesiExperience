import { redirect } from 'next/navigation';
import { getIsNewUser } from '@/features/account/data/get-is-new-user';

import { dedupedAuth } from '@workspace/auth';
import { AuthErrorCode } from '@workspace/auth/errors';
import { toSameOriginRedirect } from '@workspace/auth/redirect-url';
import { routes } from '@workspace/routes';

const DEFAULT_REDIRECT = routes.dashboard.index;
const OAUTH_ACCOUNT_NOT_FOUND = 'oauth_account_not_found';
const OAUTH_ACCOUNT_EXISTS = 'oauth_account_exists';

type Props = {
  searchParams: Promise<{ intent?: string; redirectTo?: string }>;
};

export default async function OAuthCallbackPage({ searchParams }: Props) {
  const params = await searchParams;
  const intent = params.intent === 'signup' ? 'signup' : 'signin';
  const redirectTo = toSameOriginRedirect(params.redirectTo, {
    fallback: DEFAULT_REDIRECT
  });

  const session = await dedupedAuth();
  if (!session?.user?.id) {
    redirect(
      `${routes.dashboard.auth.signIn}?error=${AuthErrorCode.UnknownError}`
    );
  }

  const isNewUser = await getIsNewUser(session.user.id);
  if (isNewUser === null) {
    redirect(
      `${routes.dashboard.auth.signIn}?error=${AuthErrorCode.UnknownError}`
    );
  }

  if (intent === 'signin' && isNewUser) {
    redirect(
      `${routes.dashboard.auth.signIn}?error=${OAUTH_ACCOUNT_NOT_FOUND}`
    );
  }

  if (intent === 'signup' && !isNewUser) {
    redirect(`${routes.dashboard.auth.signIn}?error=${OAUTH_ACCOUNT_EXISTS}`);
  }

  redirect(redirectTo);
}
