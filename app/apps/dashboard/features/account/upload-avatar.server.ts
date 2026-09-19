import 'server-only';

import { env } from '@/env';

import { ValidationError } from '@workspace/common/errors';
import {
  AVATAR_UPLOAD_CONFIG,
  validateFile,
  type UploadResult
} from '@workspace/common/file-validation';
import { resizeImage } from '@workspace/common/image';
import { db, eq, userTable } from '@workspace/database';
import {
  createCloudinaryStorage,
  type StorageProvider
} from '@workspace/storage';

const AVATAR_FOLDER = 'arki';

let cachedStorage: StorageProvider | null = null;

export function getCloudinaryStorage(): StorageProvider {
  if (cachedStorage) return cachedStorage;
  const { CLOUDINARY_CLOUD_NAME, CLOUDINARY_API_KEY, CLOUDINARY_API_SECRET } =
    env;
  if (!CLOUDINARY_CLOUD_NAME || !CLOUDINARY_API_KEY || !CLOUDINARY_API_SECRET) {
    throw new Error(
      'Configure CLOUDINARY_CLOUD_NAME, CLOUDINARY_API_KEY e CLOUDINARY_API_SECRET para upload.'
    );
  }
  cachedStorage = createCloudinaryStorage({
    cloudName: CLOUDINARY_CLOUD_NAME,
    apiKey: CLOUDINARY_API_KEY,
    apiSecret: CLOUDINARY_API_SECRET
  });
  return cachedStorage;
}

export async function uploadAvatarForUser(
  userId: string,
  file: File
): Promise<{ url: string }> {
  const buffer = Buffer.from(await file.arrayBuffer());
  const validation: UploadResult = validateFile(buffer, AVATAR_UPLOAD_CONFIG);
  if (!validation.ok) {
    throw new ValidationError(validation.error.message);
  }

  const { buffer: validatedBuffer, contentType } = validation.data;
  const resized = await resizeImage(validatedBuffer, contentType);
  const storage = getCloudinaryStorage();
  const key = `avatar-${userId}`;
  const { url } = await storage.upload(resized, key, {
    folder: AVATAR_FOLDER,
    contentType
  });

  await db
    .update(userTable)
    .set({ image: url })
    .where(eq(userTable.id, userId));

  return { url };
}

export async function deleteAvatarForUser(userId: string): Promise<void> {
  await db
    .update(userTable)
    .set({ image: null })
    .where(eq(userTable.id, userId));
}
