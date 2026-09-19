import { describe, expect, it } from 'vitest';

import {
  AVATAR_UPLOAD_CONFIG,
  DOCUMENT_MAX_SIZE_BYTES,
  validateDocumentFile,
  validateFile
} from './file-validation';

describe('validateFile', () => {
  it('accepts valid JPEG (magic bytes FF D8 FF)', () => {
    const jpeg = Buffer.from([0xff, 0xd8, 0xff, 0x00, 0x01, 0x02]);
    const result = validateFile(jpeg, AVATAR_UPLOAD_CONFIG);
    expect(result.ok).toBe(true);
    if (result.ok) {
      expect(result.data.contentType).toBe('image/jpeg');
      expect(result.data.buffer).toBe(jpeg);
    }
  });

  it('accepts valid PNG (magic bytes 89 50 4E 47 0D 0A 1A 0A)', () => {
    const png = Buffer.from([
      0x89, 0x50, 0x4e, 0x47, 0x0d, 0x0a, 0x1a, 0x0a, 0x00, 0x00
    ]);
    const result = validateFile(png, AVATAR_UPLOAD_CONFIG);
    expect(result.ok).toBe(true);
    if (result.ok) {
      expect(result.data.contentType).toBe('image/png');
    }
  });

  it('accepts valid WebP (RIFF....WEBP)', () => {
    const webp = Buffer.alloc(12);
    webp[0] = 0x52;
    webp[1] = 0x49;
    webp[2] = 0x46;
    webp[3] = 0x46;
    webp[8] = 0x57;
    webp[9] = 0x45;
    webp[10] = 0x42;
    webp[11] = 0x50;
    const result = validateFile(webp, AVATAR_UPLOAD_CONFIG);
    expect(result.ok).toBe(true);
    if (result.ok) {
      expect(result.data.contentType).toBe('image/webp');
    }
  });

  it('rejects buffer larger than maxSizeBytes', () => {
    const jpeg = Buffer.from([
      0xff,
      0xd8,
      0xff,
      ...Array(2 * 1024 * 1024).fill(0)
    ]);
    const result = validateFile(jpeg, AVATAR_UPLOAD_CONFIG);
    expect(result.ok).toBe(false);
    if (!result.ok) {
      expect(result.error.code).toBe('FILE_TOO_LARGE');
      expect(result.error.message).toContain('2 MB');
    }
  });

  it('rejects buffer with wrong magic bytes', () => {
    const notImage = Buffer.from([0x00, 0x01, 0x02, 0x03, 0x04]);
    const result = validateFile(notImage, AVATAR_UPLOAD_CONFIG);
    expect(result.ok).toBe(false);
    if (!result.ok) {
      expect(result.error.code).toBe('INVALID_FILE_TYPE');
      expect(result.error.message).toContain('JPEG');
    }
  });

  it('rejects too short buffer for WebP (RIFF but no WEBP)', () => {
    const riffOnly = Buffer.from([
      0x52, 0x49, 0x46, 0x46, 0x00, 0x00, 0x00, 0x00
    ]);
    const result = validateFile(riffOnly, AVATAR_UPLOAD_CONFIG);
    expect(result.ok).toBe(false);
    if (!result.ok) {
      expect(result.error.code).toBe('INVALID_FILE_TYPE');
    }
  });

  it('rejects empty buffer', () => {
    const result = validateFile(Buffer.alloc(0), AVATAR_UPLOAD_CONFIG);
    expect(result.ok).toBe(false);
    if (!result.ok) {
      expect(result.error.code).toBe('INVALID_FILE_TYPE');
    }
  });
});

describe('validateDocumentFile', () => {
  it('aceita PDF pelo magic byte independente do nome', () => {
    const pdf = Buffer.from('%PDF-1.7 conteudo', 'utf-8');
    const result = validateDocumentFile(pdf, 'qualquer.bin');
    expect(result.ok).toBe(true);
    if (result.ok) {
      expect(result.data.contentType).toBe('application/pdf');
    }
  });

  it('aceita markdown UTF-8 pela extensão', () => {
    const md = Buffer.from('# Título\n\nConteúdo em português.', 'utf-8');
    const result = validateDocumentFile(md, 'guia.MD');
    expect(result.ok).toBe(true);
    if (result.ok) {
      expect(result.data.contentType).toBe('text/markdown');
    }
  });

  it('aceita txt UTF-8 pela extensão', () => {
    const txt = Buffer.from('linha um\nlinha dois', 'utf-8');
    const result = validateDocumentFile(txt, 'notas.txt');
    expect(result.ok).toBe(true);
    if (result.ok) {
      expect(result.data.contentType).toBe('text/plain');
    }
  });

  it('rejeita binário renomeado para .md', () => {
    const binary = Buffer.from([0x4d, 0x5a, 0x00, 0x01, 0x02, 0x03]);
    const result = validateDocumentFile(binary, 'virus.md');
    expect(result.ok).toBe(false);
    if (!result.ok) {
      expect(result.error.code).toBe('INVALID_FILE_TYPE');
    }
  });

  it('rejeita UTF-8 inválido em arquivo de texto', () => {
    const invalid = Buffer.from([0xc3, 0x28, 0x61, 0x62]);
    const result = validateDocumentFile(invalid, 'quebrado.txt');
    expect(result.ok).toBe(false);
    if (!result.ok) {
      expect(result.error.code).toBe('INVALID_FILE_TYPE');
    }
  });

  it('rejeita extensão desconhecida', () => {
    const text = Buffer.from('conteudo texto', 'utf-8');
    const result = validateDocumentFile(text, 'planilha.csv');
    expect(result.ok).toBe(false);
    if (!result.ok) {
      expect(result.error.code).toBe('INVALID_FILE_TYPE');
    }
  });

  it('rejeita arquivo vazio', () => {
    const result = validateDocumentFile(Buffer.alloc(0), 'vazio.txt');
    expect(result.ok).toBe(false);
    if (!result.ok) {
      expect(result.error.code).toBe('EMPTY_FILE');
    }
  });

  it('rejeita documento acima de 10 MB', () => {
    const big = Buffer.alloc(DOCUMENT_MAX_SIZE_BYTES + 1, 0x61);
    const result = validateDocumentFile(big, 'grande.txt');
    expect(result.ok).toBe(false);
    if (!result.ok) {
      expect(result.error.code).toBe('FILE_TOO_LARGE');
    }
  });
});
