'use server';

import { redirect } from 'next/navigation';
import { actionClient } from '@/actions/safe-action';
import { returnValidationErrors } from 'next-safe-action';

import { hashPassword } from '@workspace/auth/password';
import { createOtpTokens } from '@workspace/auth/verification';
import { APP_NAME } from '@workspace/common/app';
import { db, eq } from '@workspace/database';
import { userTable } from '@workspace/database/schema';
import { sendVerifyEmailAddressEmail } from '@workspace/email/send-verify-email-address-email';
import { routes } from '@workspace/routes';

import { signUpSchema } from '../schemas/sign-up-schema';

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

    const hashedPassword = await hashPassword(parsedInput.password);

    await db.insert(userTable).values({
      name: parsedInput.name.trim(),
      email: normalizedEmail,
      password: hashedPassword,
      locale: 'pt-BR',
      completedOnboarding: false
    });

    try {
      const { otp, hashedOtp } = await createOtpTokens(normalizedEmail);
      const verificationLink =
        routes.dashboard.auth.verifyEmail.request.byToken(hashedOtp);

      await sendVerifyEmailAddressEmail({
        recipient: normalizedEmail,
        appName: APP_NAME,
        name: parsedInput.name.trim(),
        otp,
        verificationLink
      });
    } catch (e) {
      console.error('[signUp] Failed to send verification email:', e);
    }

    redirect(
      `${routes.dashboard.auth.verifyEmail.index}?email=${encodeURIComponent(parsedInput.email)}`
    );
  });
