'use server';

import { redirect } from 'next/navigation';
import { returnValidationErrors } from 'next-safe-action';

import { signUpSchema } from '@workspace/auth/auth-schemas';
import { hashPassword } from '@workspace/auth/password';
import { createOtpTokens } from '@workspace/auth/verification';
import { APP_NAME } from '@workspace/common/app';
import { db, eq } from '@workspace/database';
import { userTable } from '@workspace/database/schema';
import { sendVerifyEmailAddressEmail } from '@workspace/email/send-verify-email-address-email';
import { routes } from '@workspace/routes';

import { actionClient } from '~/lib/safe-action';

const EMAIL_ALREADY_TAKEN = 'Este e-mail já está em uso.';

export const signUp = actionClient
  .metadata({ actionName: 'signUp' })
  .inputSchema(signUpSchema)
  .action(async ({ parsedInput }) => {
    const normalizedEmail = parsedInput.email.toLowerCase().trim();

    const [existingUser] = await db
      .select({ id: userTable.id })
      .from(userTable)
      .where(eq(userTable.email, normalizedEmail))
      .limit(1);

    if (existingUser) {
      return returnValidationErrors(signUpSchema, {
        email: { _errors: [EMAIL_ALREADY_TAKEN] }
      });
    }

    await db.insert(userTable).values({
      name: parsedInput.name.trim(),
      email: normalizedEmail,
      password: await hashPassword(parsedInput.password),
      locale: 'pt-BR',
      completedOnboarding: true
    });

    try {
      const { otp, hashedOtp } = await createOtpTokens(normalizedEmail);

      await sendVerifyEmailAddressEmail({
        recipient: normalizedEmail,
        appName: APP_NAME,
        name: parsedInput.name.trim(),
        otp,
        verificationLink: routes.aiChat.verifyEmail.request.byToken(hashedOtp)
      });
    } catch (e) {
      console.error('[signUp] falha ao enviar email de verificação:', e);
    }

    redirect(
      `${routes.aiChat.verifyEmail.index}?email=${encodeURIComponent(parsedInput.email)}`
    );
  });
