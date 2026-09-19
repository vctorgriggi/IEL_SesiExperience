import { PutObjectCommand, S3Client } from '@aws-sdk/client-s3';

import type { StorageProvider, UploadOptions, UploadResult } from '../types';

export type R2StorageConfig = {
  bucket: string;
  accountId: string;
  accessKeyId: string;
  secretAccessKey: string;
  /** Opcional: URL base pública (bucket R2 ou domínio customizado). */
  publicBaseUrl?: string;
};

export function createR2Storage(config: R2StorageConfig): StorageProvider {
  const endpoint = `https://${config.accountId}.r2.cloudflarestorage.com`;
  const client = new S3Client({
    region: 'auto',
    endpoint,
    credentials: {
      accessKeyId: config.accessKeyId,
      secretAccessKey: config.secretAccessKey
    },
    forcePathStyle: true
  });

  return {
    async upload(
      file: Buffer,
      key: string,
      options?: UploadOptions
    ): Promise<UploadResult> {
      const fullKey = options?.folder ? `${options.folder}/${key}` : key;
      await client.send(
        new PutObjectCommand({
          Bucket: config.bucket,
          Key: fullKey,
          Body: file,
          ContentType: options?.contentType ?? 'application/octet-stream'
        })
      );

      if (config.publicBaseUrl) {
        const url = `${config.publicBaseUrl.replace(/\/$/, '')}/${fullKey}`;
        return { url };
      }
      // R2 sem URL pública: retorna path-style (pode exigir signed URLs na prática)
      const url = `${endpoint}/${config.bucket}/${fullKey}`;
      return { url };
    }
  };
}
