import 'server-only';

import { canAccessOrganizationsList } from '@/features/members/permissions';

import {
  db,
  membershipTable,
  organizationTable,
  Role
} from '@workspace/database';

import { getOrganizationsByUserId } from '../data/get-organizations-by-user-id';

type CreateOrganizationForUserInput = {
  userId: string;
  name: string;
  slug: string;
};

export type CreatedOrganization = {
  id: string;
  name: string;
  slug: string;
};

type DbErrorWithMeta = {
  code?: string;
  constraint?: string;
  constraint_name?: string;
  message?: string;
};

function isOrganizationSlugUniqueViolation(error: unknown): boolean {
  if (!error || typeof error !== 'object') {
    return false;
  }

  const dbError = error as DbErrorWithMeta;
  if (dbError.code !== '23505') {
    return false;
  }

  return (
    dbError.constraint === 'IX_organization_slug_unique' ||
    dbError.constraint_name === 'IX_organization_slug_unique' ||
    dbError.message?.includes('IX_organization_slug_unique') === true
  );
}

export async function createOrganizationForUser({
  userId,
  name,
  slug
}: CreateOrganizationForUserInput): Promise<CreatedOrganization> {
  const organizations = await getOrganizationsByUserId(userId);
  const canCreate = canAccessOrganizationsList(organizations);

  if (!canCreate) {
    throw new Error('Você não tem permissão para criar organizações.');
  }

  const normalizedName = name.trim();
  const normalizedSlug = slug.trim().toLowerCase();

  try {
    return await db.transaction(async (tx) => {
      const [organization] = await tx
        .insert(organizationTable)
        .values({
          name: normalizedName,
          slug: normalizedSlug
        })
        .returning({
          id: organizationTable.id,
          name: organizationTable.name,
          slug: organizationTable.slug
        });

      if (!organization) {
        throw new Error('Falha ao criar organização');
      }

      await tx.insert(membershipTable).values({
        organizationId: organization.id,
        userId,
        role: Role.ADMIN,
        isOwner: true
      });

      return {
        id: String(organization.id),
        name: String(organization.name),
        slug: String(organization.slug)
      };
    });
  } catch (error) {
    if (isOrganizationSlugUniqueViolation(error)) {
      throw new Error('Slug já em uso. Escolha outro.');
    }

    throw error;
  }
}
