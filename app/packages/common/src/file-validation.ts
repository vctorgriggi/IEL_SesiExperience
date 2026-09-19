export const AVATAR_MAX_SIZE_BYTES = 2 * 1024 * 1024; // 2 MB
export const AVATAR_ALLOWED_MIME_TYPES = [
  'image/jpeg',
  'image/png',
  'image/webp'
] as const;

export const EVENT_IMAGE_MAX_SIZE_BYTES = 5 * 1024 * 1024; // 5 MB
export const EVENT_IMAGE_ALLOWED_MIME_TYPES = [
  'image/jpeg',
  'image/png',
  'image/webp',
  'image/gif'
] as const;

export type AllowedMimeType =
  | (typeof AVATAR_ALLOWED_MIME_TYPES)[number]
  | (typeof EVENT_IMAGE_ALLOWED_MIME_TYPES)[number];

export type UploadConfig = {
  maxSizeBytes: number;
  allowedMimeTypes: readonly string[];
};

export type UploadError = {
  code: string;
  message: string;
};

export type ValidatedFile = {
  buffer: Buffer;
  contentType: AllowedMimeType;
};

export type UploadResult =
  | { ok: true; data: ValidatedFile }
  | { ok: false; error: UploadError };

/** Config padrão para upload de avatar (tamanho + tipos). */
export const AVATAR_UPLOAD_CONFIG: UploadConfig = {
  maxSizeBytes: AVATAR_MAX_SIZE_BYTES,
  allowedMimeTypes: [...AVATAR_ALLOWED_MIME_TYPES]
};

/** Config para imagem de evento (5 MB, jpeg/png/webp/gif). */
export const EVENT_IMAGE_UPLOAD_CONFIG: UploadConfig = {
  maxSizeBytes: EVENT_IMAGE_MAX_SIZE_BYTES,
  allowedMimeTypes: [...EVENT_IMAGE_ALLOWED_MIME_TYPES]
};

const MAGIC_BYTES: Array<{
  mime: AllowedMimeType;
  signature: number[];
  check?: (b: Buffer) => boolean;
}> = [
  // JPEG: FF D8 FF
  { mime: 'image/jpeg', signature: [0xff, 0xd8, 0xff] },
  // PNG: 89 50 4E 47 0D 0A 1A 0A
  {
    mime: 'image/png',
    signature: [0x89, 0x50, 0x4e, 0x47, 0x0d, 0x0a, 0x1a, 0x0a]
  },
  // WebP: RIFF (0-3) .... WEBP (8-11)
  {
    mime: 'image/webp',
    signature: [0x52, 0x49, 0x46, 0x46],
    check: (b) =>
      b.length >= 12 &&
      b[8] === 0x57 &&
      b[9] === 0x45 &&
      b[10] === 0x42 &&
      b[11] === 0x50
  },
  {
    mime: 'image/gif',
    signature: [0x47, 0x49, 0x46, 0x38],
    check: (b) =>
      b.length >= 6 && (b[4] === 0x37 || b[4] === 0x39) && b[5] === 0x61
  }
];

function bufferStartsWith(buffer: Buffer, signature: number[]): boolean {
  if (buffer.length < signature.length) return false;
  for (let i = 0; i < signature.length; i++) {
    if (buffer[i] !== signature[i]) return false;
  }
  return true;
}

function detectMimeFromMagic(buffer: Buffer): AllowedMimeType | null {
  for (const { mime, signature, check } of MAGIC_BYTES) {
    if (!bufferStartsWith(buffer, signature)) continue;
    if (check && !check(buffer)) continue;
    return mime;
  }
  return null;
}

const DEFAULT_SIZE_MESSAGE = 'A imagem deve ter no máximo 2 MB.';
const DEFAULT_TYPE_MESSAGE = 'Use uma imagem em JPEG, PNG ou WebP.';

export const DOCUMENT_MAX_SIZE_BYTES = 10 * 1024 * 1024; // 10 MB

export type DocumentMimeType =
  | 'application/pdf'
  | 'text/plain'
  | 'text/markdown';

export type DocumentValidationResult =
  | { ok: true; data: { buffer: Buffer; contentType: DocumentMimeType } }
  | { ok: false; error: UploadError };

const PDF_SIGNATURE = [0x25, 0x50, 0x44, 0x46];

const DOCUMENT_EXTENSION_MIME: Record<string, DocumentMimeType> = {
  md: 'text/markdown',
  txt: 'text/plain'
};

function isUtf8Text(buffer: Buffer): boolean {
  if (buffer.subarray(0, 1024).includes(0)) return false;
  try {
    new TextDecoder('utf-8', { fatal: true }).decode(buffer);
    return true;
  } catch {
    return false;
  }
}

export function validateDocumentFile(
  buffer: Buffer,
  fileName: string
): DocumentValidationResult {
  if (buffer.length === 0) {
    return {
      ok: false,
      error: { code: 'EMPTY_FILE', message: 'O arquivo está vazio.' }
    };
  }

  if (buffer.length > DOCUMENT_MAX_SIZE_BYTES) {
    return {
      ok: false,
      error: {
        code: 'FILE_TOO_LARGE',
        message: 'O documento deve ter no máximo 10 MB.'
      }
    };
  }

  if (bufferStartsWith(buffer, PDF_SIGNATURE)) {
    return { ok: true, data: { buffer, contentType: 'application/pdf' } };
  }

  const extension = fileName.split('.').pop()?.toLowerCase() ?? '';
  const contentType = DOCUMENT_EXTENSION_MIME[extension];

  if (!contentType || !isUtf8Text(buffer)) {
    return {
      ok: false,
      error: {
        code: 'INVALID_FILE_TYPE',
        message: 'Use um documento em Markdown, TXT ou PDF.'
      }
    };
  }

  return { ok: true, data: { buffer, contentType } };
}

export function validateFile(
  buffer: Buffer,
  config: UploadConfig,
  options?: { sizeErrorMessage?: string; typeErrorMessage?: string }
): UploadResult {
  const sizeMessage = options?.sizeErrorMessage ?? DEFAULT_SIZE_MESSAGE;
  const typeMessage = options?.typeErrorMessage ?? DEFAULT_TYPE_MESSAGE;

  if (buffer.length > config.maxSizeBytes) {
    return {
      ok: false,
      error: {
        code: 'FILE_TOO_LARGE',
        message: sizeMessage
      }
    };
  }

  const detectedMime = detectMimeFromMagic(buffer);
  if (!detectedMime) {
    return {
      ok: false,
      error: {
        code: 'INVALID_FILE_TYPE',
        message: typeMessage
      }
    };
  }

  if (!config.allowedMimeTypes.includes(detectedMime)) {
    return {
      ok: false,
      error: {
        code: 'FILE_TYPE_NOT_ALLOWED',
        message: typeMessage
      }
    };
  }

  return {
    ok: true,
    data: { buffer, contentType: detectedMime }
  };
}
