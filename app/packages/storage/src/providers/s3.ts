import { PutObjectCommand, S3Client } from '@aws-sdk/client-s3';

import type { StorageProvider, UploadOptions, UploadResult } from '../types';

export type S3StorageConfig = {
  bucket: string;
  region: string;
  accessKeyId: string;
  secretAccessKey: string;
  /** Opcional: URL base pública (ex.: CDN). Se não definido, usa URL padrão S3. */
  publicBaseUrl?: string;
  /** Se true, define ACL public-read no upload (necessário para URL S3 padrão). */
  publicRead?: boolean;
};

export function createS3Storage(config: S3StorageConfig): StorageProvider {
  const client = new S3Client({
    region: config.region,
    credentials: {
      accessKeyId: config.accessKeyId,
      secretAccessKey: config.secretAccessKey
    }
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
          ContentType: options?.contentType ?? 'application/octet-stream',
          ...(config.publicRead && { ACL: 'public-read' })
        })
      );

      const url = config.publicBaseUrl
        ? `${config.publicBaseUrl.replace(/\/$/, '')}/${fullKey}`
        : `https://${config.bucket}.s3.${config.region}.amazonaws.com/${fullKey}`;
      return { url };
    }
  };
}
