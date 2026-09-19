'use server';

import { z } from 'zod';

import { MINIMUM_PASSWORD_LENGTH } from '@workspace/auth/constants';
import {
  hashPassword,
  passwordValidator,
  verifyPassword
} from '@workspace/auth/password';
import { db, eq, userTable } from '@workspace/database';

import { getAiChatUserId } from '~/lib/auth-user';
import { actionClient } from '~/lib/safe-action';

const schema = z
  .object({
    currentPassword: z.string().min(1, 'Informe a senha atual.').max(72),
    password: z
      .string()
      .min(
        MINIMUM_PASSWORD_LENGTH,
        `Mínimo de ${MINIMUM_PASSWORD_LENGTH} caracteres.`
      )
      .max(72)
      .refine((value) => passwordValidator.validate(value).success, {
        message: 'Use maiúscula, minúscula e número.'
      }),
    confirmPassword: z.string()
  })
  .refine((data) => data.password === data.confirmPassword, {
    message: 'As senhas não conferem.',
    path: ['confirmPassword']
  });

export const changePassword = actionClient
  .metadata({ actionName: 'changePassword' })
  .inputSchema(schema)
  .action(async ({ parsedInput }) => {
    const userId = await getAiChatUserId();
    if (!userId) return { ok: false as const, error: 'Não autorizado.' };

    const [user] = await db
      .select({ password: userTable.password })
      .from(userTable)
      .where(eq(userTable.id, userId))
      .limit(1);

    if (!user?.password) {
      return { ok: false as const, error: 'Esta conta não usa senha.' };
    }

    const matches = await verifyPassword(
      parsedInput.currentPassword,
      user.password
    );
    if (!matches) {
      return { ok: false as const, error: 'Senha atual incorreta.' };
    }

    await db
      .update(userTable)
      .set({ password: await hashPassword(parsedInput.password) })
      .where(eq(userTable.id, userId));

    return { ok: true as const };
  });
