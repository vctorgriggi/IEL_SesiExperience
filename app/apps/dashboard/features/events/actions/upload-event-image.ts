'use server';

import { getAuthContext } from '@workspace/auth/context';
import { UnauthorizedError } from '@workspace/common/errors';

import { uploadEventImage } from './upload-event-image.server';

export async function uploadEventImageAction(
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

  return uploadEventImage(file);
}
