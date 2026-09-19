'use server';

import crypto from 'crypto';
import { revalidatePath } from 'next/cache';
import { authActionClient } from '@/actions/safe-action';
import { resolveOrgSlugForRouting } from '@/features/organizations/routing/get-organization-slug-server';
import { authenticator } from 'otplib';

import { symmetricEncrypt } from '@workspace/auth/encryption';
import { keys as authKeys } from '@workspace/auth/keys';
import { APP_NAME } from '@workspace/common/app';
import { ValidationError } from '@workspace/common/errors';
import { authenticatorAppTable, db, eq } from '@workspace/database';
import { routes } from '@workspace/routes';

import { totpEnableActionSchema } from '../schemas/totp-enable-schema';

const RECOVERY_CODES_COUNT = 10;
const RECOVERY_CODE_LENGTH = 8;

function generateRecoveryCodes(): string[] {
  const codes: string[] = [];
  const chars = '0123456789abcdefghijklmnopqrstuvwxyz';
  for (let i = 0; i < RECOVERY_CODES_COUNT; i++) {
    let code = '';
    for (let j = 0; j < RECOVERY_CODE_LENGTH; j++) {
      code += chars[crypto.randomInt(0, chars.length)];
    }
    codes.push(code);
  }
  return codes;
}

export const totpEnable = authActionClient
  .metadata({ actionName: 'totpEnable' })
  .inputSchema(totpEnableActionSchema)
  .action(async ({ parsedInput, ctx }) => {
    const isValid = authenticator.check(
      parsedInput.totpCode,
      parsedInput.secret
    );
    if (!isValid) {
      throw new ValidationError('Código TOTP inválido.');
    }

    const key = authKeys().AUTH_SECRET;
    const recoveryCodes = generateRecoveryCodes();
    const encryptedSecret = symmetricEncrypt(parsedInput.secret, key);
    const encryptedRecoveryCodes = symmetricEncrypt(
      JSON.stringify(recoveryCodes),
      key
    );

    await db
      .delete(authenticatorAppTable)
      .where(eq(authenticatorAppTable.userId, ctx.session.user.id));

    await db.insert(authenticatorAppTable).values({
      userId: ctx.session.user.id,
      accountName: ctx.session.user.email ?? 'user',
      issuer: APP_NAME,
      secret: encryptedSecret,
      recoveryCodes: encryptedRecoveryCodes
    });

    const slug = await resolveOrgSlugForRouting();
    const securityPath = slug
      ? routes.dashboard.org(slug).settings.security
      : routes.dashboard.onboarding.index;

    revalidatePath(securityPath);

    return { recoveryCodes };
  });
