'use server';

import { revalidatePath } from 'next/cache';
import { z } from 'zod';

import { db, eq, userTable } from '@workspace/database';
import { routes } from '@workspace/routes';

import { getAiChatUserId } from '~/lib/auth-user';
import { actionClient } from '~/lib/safe-action';

const schema = z.object({
  name: z
    .string({ error: 'Nome é obrigatório.' })
    .trim()
    .min(1, 'Nome é obrigatório.')
    .max(64, 'Máximo de 64 caracteres.')
});

export const updateProfile = actionClient
  .metadata({ actionName: 'updateProfile' })
  .inputSchema(schema)
  .action(async ({ parsedInput }) => {
    const userId = await getAiChatUserId();
    if (!userId) return { ok: false as const, error: 'Não autorizado.' };

    await db
      .update(userTable)
      .set({ name: parsedInput.name })
      .where(eq(userTable.id, userId));

    revalidatePath(routes.aiChat.settings);
    return { ok: true as const };
  });
