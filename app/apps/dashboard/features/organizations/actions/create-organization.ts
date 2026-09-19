'use server';

import { revalidatePath } from 'next/cache';
import { authActionClient } from '@/actions/safe-action';
import { UNAUTHORIZED_SESSION_MESSAGE } from '@/features/auth/constants/unauthorized';

import { UnauthorizedError } from '@workspace/common/errors';
import { routes } from '@workspace/routes';

import { createOrganizationSchema } from '../schemas/create-organization-schema';
import { createOrganizationForUser } from './create-organization-core';

export type CreateOrganizationResult = {
  id: string;
  name: string;
  slug: string;
};

export const createOrganization = authActionClient
  .metadata({ actionName: 'createOrganization' })
  .inputSchema(createOrganizationSchema)
  .action(async ({ parsedInput, ctx }) => {
    const userId = ctx.session?.user?.id;
    if (!userId) {
      throw new UnauthorizedError(UNAUTHORIZED_SESSION_MESSAGE);
    }
    const data = await createOrganizationForUser({
      userId,
      name: parsedInput.name,
      slug: parsedInput.slug
    });

    revalidatePath('/');
    revalidatePath(routes.dashboard.index);

    return {
      id: String(data.id),
      name: String(data.name),
      slug: String(data.slug)
    };
  });
