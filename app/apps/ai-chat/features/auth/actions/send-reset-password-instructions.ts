'use server';

import { sendResetPasswordInstructionsSchema } from '@workspace/auth/auth-schemas';
import { PASSWORD_RESET_EXPIRY_HOURS } from '@workspace/auth/constants';
import { APP_NAME } from '@workspace/common/app';
import { and, db, eq, gte } from '@workspace/database';
import {
  resetPasswordRequestTable,
  userTable
} from '@workspace/database/schema';
import { sendPasswordResetEmail } from '@workspace/email/send-password-reset-email';
import { routes } from '@workspace/routes';

import { actionClient } from '~/lib/safe-action';

const HOUR_IN_MS = 60 * 60 * 1000;

export const sendResetPasswordInstructions = actionClient
  .metadata({ actionName: 'sendResetPasswordInstructions' })
  .inputSchema(sendResetPasswordInstructionsSchema)
  .action(async ({ parsedInput }) => {
    const normalizedEmail = parsedInput.email.toLowerCase().trim();
    const [user] = await db
      .select({ name: userTable.name, email: userTable.email })
      .from(userTable)
      .where(eq(userTable.email, normalizedEmail))
      .limit(1);

    // Responde igual com ou sem conta: senão a tela vira consulta de quem
    // tem cadastro.
    if (!user?.email) return { ok: true as const };

    const now = new Date();
    const [existing] = await db
      .select({ id: resetPasswordRequestTable.id })
      .from(resetPasswordRequestTable)
      .where(
        and(
          eq(resetPasswordRequestTable.email, user.email),
          gte(resetPasswordRequestTable.expires, now)
        )
      );

    const requestId =
      existing?.id ??
      (
        await db
          .insert(resetPasswordRequestTable)
          .values({
            email: user.email,
            expires: new Date(
              now.getTime() + PASSWORD_RESET_EXPIRY_HOURS * HOUR_IN_MS
            )
          })
          .returning({ id: resetPasswordRequestTable.id })
      )[0]!.id;

    await sendPasswordResetEmail({
      recipient: user.email,
      appName: APP_NAME,
      name: user.name,
      resetPasswordLink: routes.aiChat.resetPassword.request.byId(requestId)
    });

    return { ok: true as const };
  });
