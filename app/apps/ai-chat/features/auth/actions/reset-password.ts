'use server';

import { redirect } from 'next/navigation';

import { resetPasswordSchema } from '@workspace/auth/auth-schemas';
import { hashPassword } from '@workspace/auth/password';
import { NotFoundError } from '@workspace/common/errors';
import { db, eq } from '@workspace/database';
import {
  resetPasswordRequestTable,
  userTable
} from '@workspace/database/schema';
import { routes } from '@workspace/routes';

import { actionClient } from '~/lib/safe-action';

export const resetPassword = actionClient
  .metadata({ actionName: 'resetPassword' })
  .inputSchema(resetPasswordSchema)
  .action(async ({ parsedInput }) => {
    const [request] = await db
      .select({
        email: resetPasswordRequestTable.email
      })
      .from(resetPasswordRequestTable)
      .where(eq(resetPasswordRequestTable.id, parsedInput.requestId))
      .limit(1);

    if (!request) {
      throw new NotFoundError('Solicitação de redefinição não encontrada.');
    }

    const normalizedEmail = request.email.toLowerCase().trim();
    const [user] = await db
      .select({
        id: userTable.id
      })
      .from(userTable)
      .where(eq(userTable.email, normalizedEmail))
      .limit(1);

    if (!user) {
      throw new NotFoundError('Conta não encontrada.');
    }

    const now = new Date();
    const hashedPassword = await hashPassword(parsedInput.password);

    await db.transaction(async (tx) => {
      await tx
        .update(resetPasswordRequestTable)
        .set({ expires: now })
        .where(eq(resetPasswordRequestTable.id, parsedInput.requestId));

      await tx
        .update(userTable)
        .set({ password: hashedPassword })
        .where(eq(userTable.id, user.id));
    });

    redirect(routes.aiChat.resetPassword.success);
  });
