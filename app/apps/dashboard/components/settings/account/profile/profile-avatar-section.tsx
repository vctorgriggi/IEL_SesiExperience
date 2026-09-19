'use client';

import { useRef, useState } from 'react';
import { useRouter } from 'next/navigation';
import {
  deleteAvatarAction,
  uploadAvatarAction
} from '@/features/account/actions';
import { getErrorMessage } from '@/lib/get-error-message';
import { Loading03Icon } from '@hugeicons/core-free-icons';
import { HugeiconsIcon } from '@hugeicons/react';

import {
  AVATAR_ALLOWED_MIME_TYPES,
  AVATAR_MAX_SIZE_BYTES
} from '@workspace/common/file-validation';
import { Button, toast } from '@workspace/ui';

type AvatarUploadState = 'idle' | 'uploading' | 'success' | 'error';

export function getInitials(name: string): string {
  const parts = name.trim().split(/\s+/).filter(Boolean);
  if (parts.length === 0) return '?';
  if (parts.length === 1) {
    const s = parts[0]!;
    return (s[0] ?? '?').toUpperCase();
  }
  const first = parts[0]![0] ?? '';
  const last = parts[parts.length - 1]![0] ?? '';
  return `${first}${last}`.toUpperCase();
}

type ProfileAvatarSectionProps = {
  userImage: string | null;
  userName: string;
};

export function ProfileAvatarSection({
  userImage,
  userName
}: ProfileAvatarSectionProps) {
  const router = useRouter();
  const fileInputRef = useRef<HTMLInputElement>(null);
  const [uploadState, setUploadState] = useState<AvatarUploadState>('idle');
  const [previewUrl, setPreviewUrl] = useState<string | null>(null);

  const displayUrl = previewUrl ?? userImage;
  const hasImage = Boolean(displayUrl);
  const isLoading = uploadState === 'uploading';

  const triggerFileInput = () => fileInputRef.current?.click();

  const handleFileChange = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;

    if (
      !AVATAR_ALLOWED_MIME_TYPES.includes(
        file.type as (typeof AVATAR_ALLOWED_MIME_TYPES)[number]
      )
    ) {
      toast.error('Use uma imagem em JPEG, PNG ou WebP.');
      e.target.value = '';
      return;
    }
    if (file.size > AVATAR_MAX_SIZE_BYTES) {
      toast.error('A imagem deve ter no máximo 2 MB.');
      e.target.value = '';
      return;
    }

    const objectUrl = URL.createObjectURL(file);
    setPreviewUrl(objectUrl);
    setUploadState('uploading');

    try {
      const formData = new FormData();
      formData.append('file', file);
      await uploadAvatarAction(formData);
      setUploadState('success');
      toast.success('Foto atualizada');
      router.refresh();
    } catch (err) {
      setUploadState('error');
      toast.error(getErrorMessage(err, 'Erro ao enviar foto'));
    } finally {
      URL.revokeObjectURL(objectUrl);
      setPreviewUrl(null);
      setUploadState('idle');
      e.target.value = '';
    }
  };

  const handleRemoveAvatar = async () => {
    setUploadState('uploading');
    try {
      await deleteAvatarAction({});
      setPreviewUrl(null);
      setUploadState('success');
      toast.success('Foto removida');
      router.refresh();
    } catch (err) {
      setUploadState('error');
      toast.error(getErrorMessage(err, 'Erro ao remover foto'));
    } finally {
      setUploadState('idle');
    }
  };

  return (
    <div className="rounded-lg border bg-card p-6">
      <div className="flex items-center gap-5">
        <div className="relative flex h-16 w-16 shrink-0">
          <button
            type="button"
            onClick={triggerFileInput}
            disabled={isLoading}
            className="relative flex h-16 w-16 overflow-hidden rounded-full border border-border bg-muted/50 ring-2 ring-border/50 focus:outline-none focus:ring-2 focus:ring-ring focus:ring-offset-2 disabled:pointer-events-none"
            aria-label="Alterar foto"
          >
            {displayUrl ? (
              <img
                src={displayUrl}
                alt="Sua foto"
                className="h-full w-full object-cover"
              />
            ) : (
              <span
                className="flex h-full w-full items-center justify-center text-xl font-medium text-muted-foreground"
                aria-hidden
              >
                {getInitials(userName)}
              </span>
            )}
            {isLoading && (
              <span
                className="absolute inset-0 flex items-center justify-center rounded-full bg-background/80"
                aria-hidden
              >
                <HugeiconsIcon
                  icon={Loading03Icon}
                  size={32}
                  className="animate-spin text-muted-foreground"
                />
              </span>
            )}
          </button>
          <input
            ref={fileInputRef}
            type="file"
            accept="image/jpeg,image/png,image/webp"
            className="sr-only"
            aria-hidden
            onChange={handleFileChange}
          />
        </div>
        <div className="min-w-0 flex-1 space-y-1">
          <p className="font-medium text-foreground">{userName}</p>
          <div className="flex flex-wrap items-center gap-2">
            <Button
              type="button"
              onClick={triggerFileInput}
              disabled={isLoading}
            >
              Alterar foto
            </Button>
            {hasImage && (
              <Button
                severity="secondary"
                outlined
                onClick={handleRemoveAvatar}
                disabled={isLoading}
                className="text-muted-foreground"
              >
                Remover
              </Button>
            )}
          </div>
          <p className="text-xs text-muted-foreground">
            JPEG, PNG ou WebP. Máximo 2 MB.
          </p>
        </div>
      </div>
    </div>
  );
}
