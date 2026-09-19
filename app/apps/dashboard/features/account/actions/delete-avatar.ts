'use server';

import { revalidatePath } from 'next/cache';
import { authActionClient } from '@/actions/safe-action';
import { resolveOrgSlugForRouting } from '@/features/organizations/routing/get-organization-slug-server';
import { z } from 'zod';

import { routes } from '@workspace/routes';

import { deleteAvatarForUser } from '../upload-avatar.server';

const deleteAvatarSchema = z.object({});

export const deleteAvatarAction = authActionClient
  .metadata({ actionName: 'deleteAvatar' })
  .inputSchema(deleteAvatarSchema)
  .action(async ({ ctx }) => {
    await deleteAvatarForUser(ctx.session.user.id);

    const slug = await resolveOrgSlugForRouting();

    const path = slug ? routes.dashboard.org(slug).settings.profile : '/';

    revalidatePath(path);
  });
