import 'server-only';

import { getCloudinaryStorage } from '@/features/account/upload-avatar.server';

import { ValidationError } from '@workspace/common/errors';
import {
  EVENT_IMAGE_UPLOAD_CONFIG,
  validateFile,
  type UploadResult
} from '@workspace/common/file-validation';

const EVENT_IMAGE_FOLDER = 'arki';

export async function uploadEventImage(file: File): Promise<{ url: string }> {
  const buffer = Buffer.from(await file.arrayBuffer());
  const validation: UploadResult = validateFile(
    buffer,
    EVENT_IMAGE_UPLOAD_CONFIG,
    {
      sizeErrorMessage: 'A imagem deve ter no máximo 5 MB.',
      typeErrorMessage: 'Use uma imagem em JPEG, PNG, WebP ou GIF.'
    }
  );
  if (!validation.ok) {
    throw new ValidationError(validation.error.message);
  }

  const { buffer: validatedBuffer, contentType } = validation.data;
  const storage = getCloudinaryStorage();
  const key = `event-${crypto.randomUUID()}`;
  const { url } = await storage.upload(validatedBuffer, key, {
    folder: EVENT_IMAGE_FOLDER,
    contentType
  });

  return { url };
}
