'use server';

import { authActionClient } from '@/actions/safe-action';
import { authenticator } from 'otplib';
import { z } from 'zod';

import { APP_NAME } from '@workspace/common/app';

export const totpSetup = authActionClient
  .metadata({ actionName: 'totpSetup' })
  .inputSchema(z.object({}))
  .action(async ({ ctx }) => {
    const secret = authenticator.generateSecret(20);
    const accountName = ctx.session.user.email ?? ctx.session.user.id;
    const otpauthUrl = authenticator.keyuri(accountName, APP_NAME, secret);
    return { secret, otpauthUrl };
  });
