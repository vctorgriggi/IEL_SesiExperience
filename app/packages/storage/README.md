# `@workspace/storage`

Upload para S3, R2 ou Cloudinary. Uma interface: `upload(file, key, options)`. Providers em `src/providers/`.

**Uso:** no módulo server-side responsável por upload, configure o provider desejado e use `createS3Storage`, `createR2Storage` ou `createCloudinaryStorage` com o `env`.

**Env (por provider):**
- S3: `AWS_ACCESS_KEY_ID`, `AWS_SECRET_ACCESS_KEY`, `AWS_REGION`, `STORAGE_S3_BUCKET` (+ opcional: `STORAGE_S3_PUBLIC_URL`, `STORAGE_S3_PUBLIC_READ`)
- R2: `R2_ACCOUNT_ID`, `R2_ACCESS_KEY_ID`, `R2_SECRET_ACCESS_KEY`, `R2_BUCKET` (+ opcional: `R2_PUBLIC_URL`)
- Cloudinary: `CLOUDINARY_CLOUD_NAME`, `CLOUDINARY_API_KEY`, `CLOUDINARY_API_SECRET`
