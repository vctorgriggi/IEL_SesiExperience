import { v2 as cloudinary } from 'cloudinary';

import type { StorageProvider, UploadOptions, UploadResult } from '../types';

export type CloudinaryStorageConfig = {
  cloudName: string;
  apiKey: string;
  apiSecret: string;
};

export function createCloudinaryStorage(
  config: CloudinaryStorageConfig
): StorageProvider {
  cloudinary.config({
    cloud_name: config.cloudName,
    api_key: config.apiKey,
    api_secret: config.apiSecret
  });

  return {
    async upload(
      file: Buffer,
      key: string,
      options?: UploadOptions
    ): Promise<UploadResult> {
      const contentType = options?.contentType ?? 'application/octet-stream';
      const base64 = file.toString('base64');
      const dataUri = `data:${contentType};base64,${base64}`;
      const folder = options?.folder ?? 'events';
      const publicId = key.replace(/\.[^.]+$/, '');

      const result = await cloudinary.uploader.upload(dataUri, {
        folder,
        public_id: publicId,
        overwrite: true
      });

      return { url: result.secure_url };
    }
  };
}
