'use server';

import { revalidatePath } from 'next/cache';
import { authActionClient } from '@/actions/safe-action';
import { UNAUTHORIZED_SESSION_MESSAGE } from '@/features/auth/constants/unauthorized';
import { createOrganizationForUser } from '@/features/organizations/actions/create-organization-core';

import { UnauthorizedError } from '@workspace/common/errors';
import { db, eq, userTable } from '@workspace/database';
import { routes } from '@workspace/routes';

import { completeOnboardingSchema } from '../schemas/complete-onboarding-schema';

export type CompleteOnboardingResult = { redirect: string };

export const completeOnboarding = authActionClient
  .metadata({ actionName: 'completeOnboarding' })
  .inputSchema(completeOnboardingSchema)
  .action(async ({ parsedInput, ctx }) => {
    const userId = ctx.session?.user?.id;
    if (!userId) {
      throw new UnauthorizedError(UNAUTHORIZED_SESSION_MESSAGE);
    }
    const { organizationStep } = parsedInput;
    const data = await createOrganizationForUser({
      userId,
      name: organizationStep.name,
      slug: organizationStep.slug
    });

    await db
      .update(userTable)
      .set({ completedOnboarding: true })
      .where(eq(userTable.id, userId));

    revalidatePath('/');
    revalidatePath(routes.dashboard.index);

    const redirectUrl = `${routes.dashboard.select(data.slug)}?${new URLSearchParams({ source: 'onboarding' }).toString()}`;

    return { redirect: redirectUrl };
  });
