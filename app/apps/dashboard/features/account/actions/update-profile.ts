'use server';

import { revalidatePath } from 'next/cache';
import { authActionClient } from '@/actions/safe-action';
import { resolveOrgSlugForRouting } from '@/features/organizations/routing/get-organization-slug-server';

import { db, eq, userTable } from '@workspace/database';
import { routes } from '@workspace/routes';

import { updateProfileSchema } from '../schemas/update-profile-schema';

export const updateProfile = authActionClient
  .metadata({ actionName: 'updateProfile' })
  .inputSchema(updateProfileSchema)
  .action(async ({ parsedInput, ctx }) => {
    await db
      .update(userTable)
      .set({
        name: parsedInput.name,
        phone: parsedInput.phone
      })
      .where(eq(userTable.id, ctx.session.user.id));

    const slug = await resolveOrgSlugForRouting();
    const settingsPath = slug
      ? routes.dashboard.org(slug).settings.index
      : routes.dashboard.onboarding.index;
    const profilePath = slug
      ? routes.dashboard.org(slug).settings.profile
      : routes.dashboard.onboarding.index;

    revalidatePath(settingsPath);
    revalidatePath(profilePath);
  });
