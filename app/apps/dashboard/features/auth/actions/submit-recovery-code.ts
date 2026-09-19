'use server';

import { cookies } from 'next/headers';
import { actionClient } from '@/actions/safe-action';
import { returnValidationErrors } from 'next-safe-action';

import { signIn } from '@workspace/auth';
import { AuthCookies } from '@workspace/auth/cookies';
import { CredentialsSignin } from '@workspace/auth/errors';
import { Provider } from '@workspace/auth/providers.types';
import { routes } from '@workspace/routes';

import { submitRecoveryCodeSchema } from '../schemas/submit-recovery-code-schema';

export const submitRecoveryCode = actionClient
  .metadata({ actionName: 'submitRecoveryCode' })
  .inputSchema(submitRecoveryCodeSchema)
  .action(async ({ parsedInput }) => {
    const cookieStore = await cookies();
    const redirectTo =
      cookieStore.get(AuthCookies.CallbackUrl)?.value ?? routes.dashboard.index;

    try {
      await signIn(Provider.RecoveryCode, {
        ...parsedInput,
        redirectTo,
        redirect: true
      });
    } catch (error) {
      if (error instanceof CredentialsSignin) {
        return returnValidationErrors(submitRecoveryCodeSchema, {
          _errors: [error.code]
        });
      }

      throw error;
    }
  });
