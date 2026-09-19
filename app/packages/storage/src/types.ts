export type UploadOptions = {
  contentType?: string;
  folder?: string;
};

export type UploadResult = {
  url: string;
};

export type StorageProvider = {
  upload(
    file: Buffer,
    key: string,
    options?: UploadOptions
  ): Promise<UploadResult>;
};
