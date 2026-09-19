'use server';

import { revalidatePath } from 'next/cache';
import { resolveOrgSlugForRouting } from '@/features/organizations/routing/get-organization-slug-server';

import { getAuthContext } from '@workspace/auth/context';
import { UnauthorizedError } from '@workspace/common/errors';
import { routes } from '@workspace/routes';

import { uploadAvatarForUser } from '../upload-avatar.server';

export async function uploadAvatarAction(
  formData: FormData
): Promise<{ url: string }> {
  const { session } = await getAuthContext();
  if (!session) {
    throw new UnauthorizedError('Sessão inválida ou ausente.');
  }

  const file = formData.get('file');
  if (!(file instanceof File)) {
    throw new Error('Arquivo inválido');
  }

  const result = await uploadAvatarForUser(session.user.id, file);

  const slug = await resolveOrgSlugForRouting();

  const path = slug ? routes.dashboard.org(slug).settings.general : '/';

  revalidatePath(path);

  return result;
}
