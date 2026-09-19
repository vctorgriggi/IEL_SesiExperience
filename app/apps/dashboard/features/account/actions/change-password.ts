'use server';

import { revalidatePath } from 'next/cache';
import { authActionClient } from '@/actions/safe-action';
import { resolveOrgSlugForRouting } from '@/features/organizations/routing/get-organization-slug-server';

import { hashPassword, verifyPassword } from '@workspace/auth/password';
import { ValidationError } from '@workspace/common/errors';
import { accountTable, and, db, eq } from '@workspace/database';
import { routes } from '@workspace/routes';

import { changePasswordActionSchema } from '../schemas/change-password-action-schema';

const CREDENTIAL_PROVIDER = 'credential';

export const changePassword = authActionClient
  .metadata({ actionName: 'changePassword' })
  .inputSchema(changePasswordActionSchema)
  .action(async ({ parsedInput, ctx }) => {
    const [credential] = await db
      .select({
        id: accountTable.id,
        password: accountTable.password
      })
      .from(accountTable)
      .where(
        and(
          eq(accountTable.userId, ctx.session.user.id),
          eq(accountTable.provider, CREDENTIAL_PROVIDER)
        )
      )
      .limit(1);

    if (!credential) {
      throw new ValidationError('Conta com senha não encontrada.');
    }

    if (credential.password) {
      const passwordMatches = await verifyPassword(
        parsedInput.currentPassword ?? '',
        credential.password
      );

      if (!passwordMatches) {
        throw new ValidationError('Senha atual incorreta.');
      }
    }

    if (parsedInput.currentPassword === parsedInput.newPassword) {
      throw new ValidationError('A nova senha deve ser diferente da atual.');
    }

    const passwordHash = await hashPassword(parsedInput.newPassword);

    await db
      .update(accountTable)
      .set({ password: passwordHash })
      .where(eq(accountTable.id, credential.id));

    const slug = await resolveOrgSlugForRouting();
    const settingsPath = slug
      ? routes.dashboard.org(slug).settings.index
      : routes.dashboard.onboarding.index;
    const securityPath = slug
      ? routes.dashboard.org(slug).settings.security
      : routes.dashboard.onboarding.index;

    revalidatePath(settingsPath);
    revalidatePath(securityPath);
  });
