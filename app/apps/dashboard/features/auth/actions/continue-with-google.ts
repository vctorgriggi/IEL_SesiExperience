'use server';

import { actionClient } from '@/actions/safe-action';

import { signIn } from '@workspace/auth';
import { Provider } from '@workspace/auth/providers.types';
import { getRedirectAfterSignIn } from '@workspace/auth/redirect';

export const continueWithGoogle = actionClient
  .metadata({ actionName: 'continueWithGoogle' })
  .action(async () => {
    const redirectTo = await getRedirectAfterSignIn();
    await signIn(
      Provider.Google,
      { redirectTo, redirect: true },
      { prompt: 'login' }
    );
  });
