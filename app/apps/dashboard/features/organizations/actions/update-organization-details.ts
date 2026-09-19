'use server';

import { revalidatePath } from 'next/cache';
import { authOrganizationActionClient } from '@/actions/safe-action';
import { getCurrentMembership } from '@/features/members/data/get-current-membership';
import { can } from '@/features/members/permissions';

import { ForbiddenError } from '@workspace/common/errors';
import { db, eq, organizationTable } from '@workspace/database';
import { routes } from '@workspace/routes';

import { updateOrganizationDetailsSchema } from '../schemas/update-organization-details-schema';

export const updateOrganizationDetails = authOrganizationActionClient
  .metadata({ actionName: 'updateOrganizationDetails' })
  .inputSchema(updateOrganizationDetailsSchema)
  .action(async ({ parsedInput, ctx }) => {
    const membership = await getCurrentMembership();
    if (!can(membership).updateOrgSettings) {
      throw new ForbiddenError(
        'Apenas administradores podem alterar as configurações da organização.'
      );
    }

    const slug = ctx.organization.slug;
    const organizationId = ctx.organization.id;

    const set: {
      name?: string;
      address?: string | null;
      phone?: string | null;
      email?: string | null;
      website?: string | null;
    } = {};
    if (parsedInput.name !== undefined) set.name = parsedInput.name.trim();
    if (parsedInput.address !== undefined) set.address = parsedInput.address;
    if (parsedInput.phone !== undefined) set.phone = parsedInput.phone;
    if (parsedInput.email !== undefined) set.email = parsedInput.email;
    if (parsedInput.website !== undefined) set.website = parsedInput.website;

    if (Object.keys(set).length === 0) {
      throw new Error('Nenhum campo para atualizar');
    }

    await db
      .update(organizationTable)
      .set(set)
      .where(eq(organizationTable.id, organizationId));

    revalidatePath('/');
    revalidatePath(routes.dashboard.index);
    revalidatePath(routes.dashboard.org(slug).settings.general);
  });
