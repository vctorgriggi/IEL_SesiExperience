'use server';

import { revalidatePath } from 'next/cache';
import { authActionClient } from '@/actions/safe-action';
import { resolveOrgSlugForRouting } from '@/features/organizations/routing/get-organization-slug-server';

import { db, eq, userTable } from '@workspace/database';
import { routes } from '@workspace/routes';

import { marketingEmailsSchema } from '../schemas/notifications-form-schema';

export const updateMarketingEmails = authActionClient
  .metadata({ actionName: 'updateMarketingEmails' })
  .inputSchema(marketingEmailsSchema)
  .action(async ({ parsedInput, ctx }) => {
    await db
      .update(userTable)
      .set({
        enabledNewsletter: parsedInput.enabledNewsletter,
        enabledProductUpdates: parsedInput.enabledProductUpdates
      })
      .where(eq(userTable.id, ctx.session.user.id));

    const slug = await resolveOrgSlugForRouting();
    const path = slug
      ? routes.dashboard.org(slug).settings.profile
      : routes.dashboard.onboarding.index;

    revalidatePath(path);
  });
