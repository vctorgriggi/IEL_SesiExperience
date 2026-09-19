'use server';

import { actionClient } from '@/actions/safe-action';
import { returnValidationErrors } from 'next-safe-action';

import { signIn } from '@workspace/auth';
import { CredentialsSignin } from '@workspace/auth/errors';
import { Provider } from '@workspace/auth/providers.types';
import { getRedirectAfterSignIn } from '@workspace/auth/redirect';

import { passThroughCredentialsSchema } from '../schemas/pass-through-credentials-schema';

export const signInWithCredentials = actionClient
  .metadata({ actionName: 'signInWithCredentials' })
  .inputSchema(passThroughCredentialsSchema)
  .action(async ({ parsedInput }) => {
    const redirectTo = await getRedirectAfterSignIn();

    try {
      await signIn(Provider.Credentials, {
        ...parsedInput,
        redirectTo,
        redirect: true
      });
    } catch (e) {
      if (e instanceof CredentialsSignin) {
        return returnValidationErrors(passThroughCredentialsSchema, {
          _errors: [e.code]
        });
      }
      throw e;
    }
  });
