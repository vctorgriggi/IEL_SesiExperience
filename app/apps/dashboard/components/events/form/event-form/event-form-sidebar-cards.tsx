'use client';

import type { EventFormValues } from '@/features/events/schemas';
import type { EventStatus } from '@/features/events/types';
import { useWatch, type UseFormReturn } from 'react-hook-form';

import {
  Card,
  CardContent,
  CardHeader,
  CardTitle,
  Checkbox,
  cn,
  Input,
  Label,
  Select
} from '@workspace/ui';

import {
  CARD_TITLE,
  FORM_ERROR,
  FORM_HINT,
  FORM_LABEL,
  FORM_SELECT
} from './event-form-constants';

type TicketType = 'free' | 'paid';

type EventFormSidebarCardsProps = {
  form: UseFormReturn<EventFormValues>;
  isSubmitting: boolean;
};

const CARD_CLASS = 'rounded-xl border border-border bg-card p-4 sm:p-6';
const STATUS_OPTIONS: { label: string; value: EventStatus }[] = [
  { label: 'Rascunho', value: 'draft' },
  { label: 'Publicado', value: 'published' },
  { label: 'Cancelado', value: 'cancelled' },
  { label: 'Concluído', value: 'completed' }
];
const TICKET_OPTIONS: { label: string; value: TicketType }[] = [
  { label: 'Grátis', value: 'free' },
  { label: 'Pago', value: 'paid' }
];

export function EventFormSidebarCards({
  form,
  isSubmitting
}: EventFormSidebarCardsProps) {
  const errors = form.formState.errors;
  const [
    watchedStatus,
    watchedIsPublic,
    watchedTicketType,
    watchedTicketPriceCents
  ] = useWatch({
    control: form.control,
    name: ['status', 'isPublic', 'ticketType', 'ticketPriceCents'] as const
  });
  const status = (watchedStatus ?? form.getValues('status')) as EventStatus;
  const isPublic = watchedIsPublic ?? form.getValues('isPublic');
  const ticketType = (watchedTicketType ??
    form.getValues('ticketType')) as TicketType;
  const ticketPriceCents =
    watchedTicketPriceCents ?? form.getValues('ticketPriceCents');
  const setValueOptions = { shouldDirty: true, shouldValidate: true } as const;

  const handleTicketTypeChange = (value: TicketType) => {
    form.setValue('ticketType', value, setValueOptions);
    if (value === 'free') {
      form.setValue('ticketPriceCents', undefined, setValueOptions);
    }
  };

  const handleTicketPriceChange = (rawValue: string) => {
    if (rawValue === '') {
      form.setValue('ticketPriceCents', undefined, setValueOptions);
      return;
    }

    const parsed = Number(rawValue);
    form.setValue(
      'ticketPriceCents',
      Number.isFinite(parsed) && parsed >= 0
        ? Math.round(parsed * 100)
        : undefined,
      setValueOptions
    );
  };

  return (
    <div className="space-y-6">
      <Card className={CARD_CLASS}>
        <CardHeader className="pb-3">
          <CardTitle className={CARD_TITLE}>Status</CardTitle>
        </CardHeader>
        <CardContent className="pt-0">
          <Select
            value={status}
            options={STATUS_OPTIONS}
            onChange={(value) =>
              form.setValue('status', value as EventStatus, setValueOptions)
            }
            disabled={isSubmitting}
            className={cn('event-status-select', FORM_SELECT)}
          />
          <p className={FORM_HINT + ' mt-1.5'}>
            Defina a visibilidade do evento.
          </p>
        </CardContent>
      </Card>

      <Card className={CARD_CLASS}>
        <CardHeader className="pb-3">
          <CardTitle className={CARD_TITLE}>Detalhes do evento</CardTitle>
        </CardHeader>
        <CardContent className="pt-0">
          <div className="flex items-start gap-3 rounded-lg border border-border bg-muted/20 px-3 py-2.5">
            <Checkbox
              id="isPublic"
              checked={isPublic}
              onCheckedChange={(checked: boolean) =>
                form.setValue('isPublic', checked, setValueOptions)
              }
              disabled={isSubmitting}
              className="event-public-checkbox mt-0.5"
            />
            <div className="min-w-0 flex-1">
              <Label
                htmlFor="isPublic"
                className={cn(FORM_LABEL, 'cursor-pointer leading-5')}
              >
                Evento público
              </Label>
              <p className="mt-1 text-xs text-muted-foreground">
                Público aparece na listagem para todos.
              </p>
            </div>
          </div>
        </CardContent>
      </Card>

      <Card className={CARD_CLASS}>
        <CardHeader className="pb-3">
          <CardTitle className={CARD_TITLE}>Ingresso</CardTitle>
        </CardHeader>
        <CardContent className="space-y-4 pt-0">
          <div className="space-y-1.5">
            <Label
              htmlFor="ticketType"
              className={FORM_LABEL}
            >
              Tipo
            </Label>
            <Select
              id="ticketType"
              value={ticketType ?? 'free'}
              onChange={(value) => handleTicketTypeChange(value as TicketType)}
              options={TICKET_OPTIONS}
              disabled={isSubmitting}
              className={FORM_SELECT}
            />
          </div>
          {ticketType === 'paid' && (
            <div className="space-y-1.5">
              <Label
                htmlFor="ticketPriceCents"
                className={FORM_LABEL}
              >
                Preço (R$)
              </Label>
              <Input
                id="ticketPriceCents"
                type="number"
                min={0}
                step={0.01}
                inputMode="decimal"
                placeholder="0,00"
                disabled={isSubmitting}
                value={ticketPriceCents != null ? ticketPriceCents / 100 : ''}
                onChange={(e) => handleTicketPriceChange(e.target.value)}
              />
              <p className={FORM_HINT}>Valor em reais. Ex.: 25,00</p>
              {errors.ticketPriceCents && (
                <p className={FORM_ERROR}>{errors.ticketPriceCents.message}</p>
              )}
            </div>
          )}
        </CardContent>
      </Card>
    </div>
  );
}
