'use server';

import { actionClient } from '@/actions/safe-action';
import { addHours } from 'date-fns';

import { PASSWORD_RESET_EXPIRY_HOURS } from '@workspace/auth/constants';
import { APP_NAME } from '@workspace/common/app';
import { and, db, eq, gte } from '@workspace/database';
import {
  resetPasswordRequestTable,
  userTable
} from '@workspace/database/schema';
import { sendPasswordResetEmail } from '@workspace/email/send-password-reset-email';
import { routes } from '@workspace/routes';

import { sendResetPasswordInstructionsSchema } from '../schemas/send-reset-password-instructions-schema';

export const sendResetPasswordInstructions = actionClient
  .metadata({ actionName: 'sendResetPasswordInstructions' })
  .inputSchema(sendResetPasswordInstructionsSchema)
  .action(async ({ parsedInput }) => {
    const normalizedEmail = parsedInput.email.toLowerCase().trim();
    const [user] = await db
      .select({
        name: userTable.name,
        email: userTable.email
      })
      .from(userTable)
      .where(eq(userTable.email, normalizedEmail))
      .limit(1);

    if (!user?.email) {
      return { ok: true as const };
    }

    const now = new Date();
    const existingRequests = await db
      .select({
        id: resetPasswordRequestTable.id
      })
      .from(resetPasswordRequestTable)
      .where(
        and(
          eq(resetPasswordRequestTable.email, user.email),
          gte(resetPasswordRequestTable.expires, now)
        )
      );

    const requestId =
      existingRequests[0]?.id ??
      (
        await db
          .insert(resetPasswordRequestTable)
          .values({
            email: user.email,
            expires: addHours(now, PASSWORD_RESET_EXPIRY_HOURS)
          })
          .returning({ id: resetPasswordRequestTable.id })
      )[0].id;

    await sendPasswordResetEmail({
      recipient: user.email,
      appName: APP_NAME,
      name: user.name,
      resetPasswordLink:
        routes.dashboard.auth.resetPassword.request.byId(requestId)
    });

    return { ok: true as const };
  });
