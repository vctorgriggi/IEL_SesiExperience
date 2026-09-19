'use server';

import { revalidatePath } from 'next/cache';
import { authActionClient } from '@/actions/safe-action';
import { resolveOrgSlugForRouting } from '@/features/organizations/routing/get-organization-slug-server';
import { authenticator } from 'otplib';

import { symmetricDecrypt } from '@workspace/auth/encryption';
import { keys as authKeys } from '@workspace/auth/keys';
import { ValidationError } from '@workspace/common/errors';
import { authenticatorAppTable, db, eq } from '@workspace/database';
import { routes } from '@workspace/routes';

import { totpDisableActionSchema } from '../schemas/totp-disable-schema';

export const totpDisable = authActionClient
  .metadata({ actionName: 'totpDisable' })
  .inputSchema(totpDisableActionSchema)
  .action(async ({ parsedInput, ctx }) => {
    const [row] = await db
      .select({
        id: authenticatorAppTable.id,
        secret: authenticatorAppTable.secret
      })
      .from(authenticatorAppTable)
      .where(eq(authenticatorAppTable.userId, ctx.session.user.id))
      .limit(1);

    if (!row) {
      throw new ValidationError('Autenticador não encontrado.');
    }

    const key = authKeys().AUTH_SECRET;
    const secret = symmetricDecrypt(row.secret, key);
    const isValid = authenticator.check(parsedInput.totpCode, secret);
    if (!isValid) {
      throw new ValidationError('Código TOTP inválido.');
    }

    await db
      .delete(authenticatorAppTable)
      .where(eq(authenticatorAppTable.userId, ctx.session.user.id));

    const slug = await resolveOrgSlugForRouting();
    const securityPath = slug
      ? routes.dashboard.org(slug).settings.security
      : routes.dashboard.onboarding.index;

    revalidatePath(securityPath);
  });
