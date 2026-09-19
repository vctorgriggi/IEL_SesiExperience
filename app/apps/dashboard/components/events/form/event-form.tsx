'use client';

import { useRef, useState } from 'react';
import { useRouter } from 'next/navigation';
import { FormErrorAlert } from '@/components/auth/error/form-error-alert';
import { createEvent, updateEvent } from '@/features/events/actions';
import { getEventsIndexPath } from '@/features/events/routing/event-navigation';
import {
  eventFormSchema,
  type CreateEventInput,
  type UpdateEventInput
} from '@/features/events/schemas';
import { geocodeAddress } from '@/features/events/services/geocode';
import type { EventDto } from '@/features/events/types';
import { useCurrentOrganizationSlug } from '@/hooks/use-current-organization-slug';
import { useZodForm } from '@/hooks/use-zod-form';
import { getErrorMessage } from '@/lib/get-error-message';
import { runSafeAction } from '@/lib/run-safe-action';
import type { FieldErrors } from 'react-hook-form';

import {
  Button,
  Card,
  CardContent,
  CardHeader,
  CardTitle,
  Input,
  Label,
  toast
} from '@workspace/ui';

import { EventFormBasicInfoCard } from './event-form/event-form-basic-info-card';
import {
  CARD_TITLE,
  FORM_ERROR,
  FORM_HINT,
  FORM_INPUT,
  FORM_LABEL
} from './event-form/event-form-constants';
import { EventFormDateTimeCard } from './event-form/event-form-date-time-card';
import { EventFormSidebarCards } from './event-form/event-form-sidebar-cards';

type EventFormEvent = EventDto & {
  latitude?: number | null;
  longitude?: number | null;
};
type EventFormProps = { event?: EventFormEvent };

// Fallback: centro de São Paulo quando geocoding falha ou endereço está vazio
const FALLBACK_COORDS = {
  latitude: -23.6456839,
  longitude: -46.6293883
} as const;
const TWO_HOURS_MS = 2 * 60 * 60 * 1000;
const GEOCODE_MIN_LENGTH = 3;
const GENERIC_SUBMIT_ERROR =
  'Não foi possível salvar o evento. Tente novamente.';
const INVALID_FORM_ERROR = 'Revise os campos destacados antes de continuar.';

const DEFAULT_VALUES: CreateEventInput = {
  slug: '',
  title: '',
  description: '',
  startDate: new Date(),
  endDate: new Date(Date.now() + TWO_HOURS_MS),
  location: '',
  imageUrl: undefined,
  ticketType: 'free',
  ticketPriceCents: undefined,
  maxAttendees: undefined,
  isPublic: false,
  status: 'draft'
};

function toEditDefaultValues(event: EventFormEvent): CreateEventInput {
  return {
    slug: event.slug ?? '',
    title: event.title,
    description: event.description ?? '',
    startDate: new Date(event.startDate),
    endDate: new Date(event.endDate),
    location: event.location ?? '',
    imageUrl: event.imageUrl ?? undefined,
    ticketType: event.ticketType ?? 'free',
    ticketPriceCents: event.ticketPriceCents ?? undefined,
    maxAttendees: event.maxAttendees ?? undefined,
    isPublic: event.isPublic,
    status: event.status as CreateEventInput['status']
  };
}

async function resolveCoords(location: string | null | undefined) {
  const trimmed = location?.trim();
  if (!trimmed || trimmed.length < GEOCODE_MIN_LENGTH) return FALLBACK_COORDS;
  const geocoded = await geocodeAddress(trimmed);
  return geocoded
    ? { latitude: geocoded.lat, longitude: geocoded.lon }
    : FALLBACK_COORDS;
}

function getFirstErrorField(
  errors: FieldErrors<CreateEventInput>
): keyof CreateEventInput | undefined {
  return Object.keys(errors).find((k) => k !== 'root') as
    | keyof CreateEventInput
    | undefined;
}

export function EventForm({ event }: EventFormProps) {
  const router = useRouter();
  const currentOrgSlug = useCurrentOrganizationSlug();
  const formRef = useRef<HTMLFormElement>(null);
  const [uploadingImage, setUploadingImage] = useState(false);
  const isEditing = !!event;

  const form = useZodForm({
    schema: eventFormSchema,
    defaultValues: event ? toEditDefaultValues(event) : DEFAULT_VALUES
  });

  const isSubmitting = form.formState.isSubmitting;

  const onSubmit = async (data: CreateEventInput) => {
    form.clearErrors('root');
    try {
      const coords = await resolveCoords(data.location);
      const payload = { ...data, ...coords };

      const action = isEditing
        ? updateEvent({ id: event.id, ...payload } satisfies UpdateEventInput)
        : createEvent(payload);

      await runSafeAction(action);

      toast.success(
        isEditing
          ? 'Evento atualizado com sucesso!'
          : 'Evento criado com sucesso!'
      );
      router.refresh();
      router.push(getEventsIndexPath(currentOrgSlug));
    } catch (err) {
      const message = getErrorMessage(err, GENERIC_SUBMIT_ERROR);
      form.setError('root', { message });
      toast.error(message);
      formRef.current?.scrollIntoView({ behavior: 'smooth', block: 'start' });
    }
  };

  const onInvalid = (errors: FieldErrors<CreateEventInput>) => {
    form.setError('root', { message: INVALID_FORM_ERROR });
    const firstErrorField = getFirstErrorField(errors);
    if (firstErrorField) form.setFocus(firstErrorField);
  };

  return (
    <form
      ref={formRef}
      onSubmit={form.handleSubmit(onSubmit, onInvalid)}
      className="space-y-6"
    >
      {form.formState.errors.root?.message && (
        <FormErrorAlert message={form.formState.errors.root?.message} />
      )}

      <div className="grid gap-5 sm:gap-6 xl:grid-cols-[minmax(0,1fr)_320px] xl:items-start">
        <div className="space-y-6">
          <EventFormBasicInfoCard
            form={form}
            isSubmitting={isSubmitting}
            uploadingImage={uploadingImage}
            setUploadingImage={setUploadingImage}
          />
          <Card className="rounded-xl border border-border bg-card p-4 sm:p-6">
            <CardHeader className="pb-3">
              <CardTitle className={CARD_TITLE}>Local e capacidade</CardTitle>
            </CardHeader>
            <CardContent className="space-y-4 pt-0">
              <div className="space-y-1.5">
                <Label
                  htmlFor="location"
                  className={FORM_LABEL}
                >
                  Endereço
                </Label>
                <Input
                  id="location"
                  {...form.register('location')}
                  placeholder="Rua, número, bairro, cidade"
                  disabled={isSubmitting}
                  className={FORM_INPUT}
                />
                <p className={FORM_HINT}>Local onde o evento será realizado.</p>
                <p className={FORM_ERROR}>
                  {form.formState.errors.location?.message}
                </p>
              </div>
              <div className="space-y-1.5">
                <Label
                  htmlFor="maxAttendees"
                  className={FORM_LABEL}
                >
                  Máximo de participantes
                </Label>
                <Input
                  id="maxAttendees"
                  type="number"
                  min={1}
                  {...form.register('maxAttendees')}
                  placeholder="Opcional"
                  disabled={isSubmitting}
                  className={FORM_INPUT}
                />
                <p className={FORM_HINT}>Deixe em branco para ilimitado.</p>
                <p className={FORM_ERROR}>
                  {form.formState.errors.maxAttendees?.message}
                </p>
              </div>
            </CardContent>
          </Card>
        </div>

        <div className="space-y-6 xl:sticky xl:top-6">
          <EventFormDateTimeCard
            form={form}
            isSubmitting={isSubmitting}
          />
          <EventFormSidebarCards
            form={form}
            isSubmitting={isSubmitting}
          />
        </div>
      </div>

      <div className="flex flex-col-reverse gap-2 border-t border-border pt-4 sm:flex-row sm:justify-end">
        <Button
          type="button"
          outlined
          onClick={() => router.back()}
          disabled={isSubmitting}
          className="min-h-11 w-full rounded-xl border border-border bg-background text-foreground hover:bg-muted sm:min-h-9 sm:w-auto"
        >
          Cancelar
        </Button>
        <Button
          type="submit"
          loading={isSubmitting}
          className="min-h-11 w-full rounded-xl border border-primary bg-primary text-primary-foreground hover:border-primary/80 hover:bg-primary/80 sm:min-h-9 sm:w-auto"
        >
          {isEditing ? 'Atualizar evento' : 'Criar evento'}
        </Button>
      </div>
    </form>
  );
}
