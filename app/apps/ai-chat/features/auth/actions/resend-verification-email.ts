'use server';

import { resendVerificationEmailSchema } from '@workspace/auth/auth-schemas';
import { createOtpTokens } from '@workspace/auth/verification';
import { APP_NAME } from '@workspace/common/app';
import { sendVerifyEmailAddressEmail } from '@workspace/email/send-verify-email-address-email';
import { routes } from '@workspace/routes';

import { actionClient } from '~/lib/safe-action';

export const resendVerificationEmail = actionClient
  .metadata({ actionName: 'resendVerificationEmail' })
  .inputSchema(resendVerificationEmailSchema)
  .action(async ({ parsedInput }) => {
    const { otp, hashedOtp } = await createOtpTokens(parsedInput.email);

    await sendVerifyEmailAddressEmail({
      recipient: parsedInput.email,
      appName: APP_NAME,
      name: parsedInput.email,
      otp,
      verificationLink: routes.aiChat.verifyEmail.request.byToken(hashedOtp)
    });

    return { ok: true as const };
  });
