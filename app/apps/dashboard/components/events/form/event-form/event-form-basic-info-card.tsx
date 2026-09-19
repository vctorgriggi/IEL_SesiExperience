'use client';

import { useRef, type ChangeEvent } from 'react';
import { uploadEventImageAction } from '@/features/events/actions';
import type { EventFormValues } from '@/features/events/schemas';
import { getErrorMessage } from '@/lib/get-error-message';
import type { UseFormReturn } from 'react-hook-form';

import {
  Button,
  Card,
  CardContent,
  CardHeader,
  CardTitle,
  cn,
  Input,
  Label,
  Textarea,
  toast
} from '@workspace/ui';

import {
  CARD_TITLE,
  FORM_ERROR,
  FORM_HINT,
  FORM_INPUT,
  FORM_LABEL
} from './event-form-constants';

type EventFormBasicInfoCardProps = {
  form: UseFormReturn<EventFormValues>;
  isSubmitting: boolean;
  uploadingImage: boolean;
  setUploadingImage: (value: boolean) => void;
};

const ACCEPTED_IMAGE_TYPES = 'image/jpeg,image/png,image/webp,image/gif';
const MAX_IMAGE_SIZE_BYTES = 5_000_000;

export function EventFormBasicInfoCard({
  form,
  isSubmitting,
  uploadingImage,
  setUploadingImage
}: EventFormBasicInfoCardProps) {
  const imageUrl = form.watch('imageUrl');
  const fileInputRef = useRef<HTMLInputElement>(null);
  const isUploadDisabled = isSubmitting || uploadingImage;

  async function handleImageSelected(event: ChangeEvent<HTMLInputElement>) {
    const file = event.target.files?.[0];
    event.target.value = '';
    if (!file) return;
    if (file.size > MAX_IMAGE_SIZE_BYTES) {
      toast.error('Arquivo excede 5 MB');
      return;
    }
    setUploadingImage(true);
    try {
      const formData = new FormData();
      formData.set('file', file);
      const { url } = await uploadEventImageAction(formData);
      form.setValue('imageUrl', url, {
        shouldDirty: true,
        shouldValidate: true
      });
      toast.success('Imagem enviada');
    } catch (err) {
      toast.error(getErrorMessage(err, 'Não foi possível enviar a imagem'));
    } finally {
      setUploadingImage(false);
    }
  }

  return (
    <Card className="rounded-xl border border-border bg-card p-4 sm:p-6">
      <CardHeader className="pb-3">
        <CardTitle className={CARD_TITLE}>Informações básicas</CardTitle>
      </CardHeader>
      <CardContent className="space-y-4 pt-0">
        <div className="space-y-1.5">
          <Label
            htmlFor="title"
            className={FORM_LABEL}
          >
            Título *
          </Label>
          <Input
            id="title"
            {...form.register('title')}
            placeholder="Nome do evento"
            disabled={isSubmitting}
            className={FORM_INPUT}
          />
          <p className={FORM_HINT}>Informe o nome do evento.</p>
          {form.formState.errors.title && (
            <p className={FORM_ERROR}>{form.formState.errors.title.message}</p>
          )}
        </div>
        <div className="space-y-1.5">
          <Label
            htmlFor="slug"
            className={FORM_LABEL}
          >
            Slug (URL)
          </Label>
          <Input
            id="slug"
            {...form.register('slug')}
            placeholder="meu-evento"
            disabled={isSubmitting}
            className={FORM_INPUT}
          />
          <p className={FORM_HINT + ' break-words'}>
            URL pública: /e/[slug]. Se deixar em branco, geramos a partir do
            título.
          </p>
          {form.formState.errors.slug && (
            <p className={FORM_ERROR}>{form.formState.errors.slug.message}</p>
          )}
        </div>
        <div className="space-y-1.5">
          <Label
            htmlFor="description"
            className={FORM_LABEL}
          >
            Descrição
          </Label>
          <Textarea
            id="description"
            {...form.register('description')}
            placeholder="Descreva seu evento..."
            rows={3}
            disabled={isSubmitting}
            className={cn(FORM_INPUT, 'min-h-[96px] resize-y py-2')}
          />
          <p className={FORM_HINT}>
            Descrição exibida na listagem e na página do evento.
          </p>
          {form.formState.errors.description && (
            <p className={FORM_ERROR}>
              {form.formState.errors.description.message}
            </p>
          )}
        </div>
        <div className="space-y-1.5">
          <Label className={FORM_LABEL}>Imagem do evento</Label>
          <input
            ref={fileInputRef}
            type="file"
            accept={ACCEPTED_IMAGE_TYPES}
            disabled={isUploadDisabled}
            onChange={handleImageSelected}
            className="sr-only"
            aria-label="Escolher imagem do evento"
          />
          <Button
            type="button"
            onClick={() => fileInputRef.current?.click()}
            disabled={isUploadDisabled}
            loading={uploadingImage}
            className="min-h-11 sm:min-h-9"
          >
            {uploadingImage ? 'Enviando...' : 'Escolher imagem'}
          </Button>
          {imageUrl && (
            <div className="relative mt-2 aspect-[16/9] w-full max-w-sm overflow-hidden rounded-lg border border-border bg-muted sm:max-w-md">
              <img
                src={imageUrl}
                alt="Preview da imagem do evento"
                className="h-full w-full object-cover"
              />
              <Button
                type="button"
                severity="secondary"
                size="small"
                className="absolute right-2 top-2 min-h-9 opacity-90"
                onClick={() =>
                  form.setValue('imageUrl', undefined, {
                    shouldDirty: true,
                    shouldValidate: true
                  })
                }
                disabled={isSubmitting}
              >
                Remover
              </Button>
            </div>
          )}
          <p className={FORM_HINT}>JPEG, PNG, WebP ou GIF. Máx. 5 MB.</p>
        </div>
      </CardContent>
    </Card>
  );
}
