'use server';

import { actionClient } from '@/actions/safe-action';

import { createOtpTokens } from '@workspace/auth/verification';
import { APP_NAME } from '@workspace/common/app';
import { sendVerifyEmailAddressEmail } from '@workspace/email/send-verify-email-address-email';
import { routes } from '@workspace/routes';

import { resendVerificationEmailSchema } from '../schemas/resend-verification-email-schema';

export const resendVerificationEmail = actionClient
  .metadata({ actionName: 'resendVerificationEmail' })
  .inputSchema(resendVerificationEmailSchema)
  .action(async ({ parsedInput }) => {
    const normalizedEmail = parsedInput.email.toLowerCase().trim();

    try {
      const { otp, hashedOtp } = await createOtpTokens(normalizedEmail);
      const verificationLink =
        routes.dashboard.auth.verifyEmail.request.byToken(hashedOtp);

      await sendVerifyEmailAddressEmail({
        recipient: normalizedEmail,
        appName: APP_NAME,
        name: normalizedEmail.split('@')[0] ?? 'Usuário',
        otp,
        verificationLink
      });

      return { ok: true as const };
    } catch (e) {
      console.error('[resendVerificationEmail] Failed to send:', e);
      throw new Error('Não foi possível reenviar o email de verificação.');
    }
  });
