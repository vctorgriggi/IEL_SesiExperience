'use client';

import type { EventFormValues } from '@/features/events/schemas';
import { useWatch, type UseFormReturn } from 'react-hook-form';

import {
  Card,
  CardContent,
  CardHeader,
  CardTitle,
  DateTimePicker,
  Label
} from '@workspace/ui';

import { CARD_TITLE, FORM_LABEL } from './event-form-constants';

type EventFormDateTimeCardProps = {
  form: UseFormReturn<EventFormValues>;
  isSubmitting: boolean;
};

export function EventFormDateTimeCard({
  form,
  isSubmitting
}: EventFormDateTimeCardProps) {
  const startDate = useWatch({
    control: form.control,
    name: 'startDate',
    defaultValue: form.getValues('startDate')
  });
  const endDate = useWatch({
    control: form.control,
    name: 'endDate',
    defaultValue: form.getValues('endDate')
  });

  return (
    <Card className="rounded-xl border border-border bg-card p-4 sm:p-6">
      <CardHeader className="pb-3">
        <CardTitle className={CARD_TITLE}>Data e horário</CardTitle>
      </CardHeader>
      <CardContent className="space-y-4 pt-0">
        <div className="space-y-1.5">
          <Label
            htmlFor="startDate"
            className={FORM_LABEL}
          >
            Início *
          </Label>
          <DateTimePicker
            id="startDate"
            value={startDate ?? null}
            onChange={(value) => {
              if (!value) return;
              form.setValue('startDate', value, {
                shouldDirty: true,
                shouldValidate: true
              });
            }}
            disabled={isSubmitting}
            placeholder="Data e hora de início"
            error={form.formState.errors.startDate?.message}
          />
        </div>
        <div className="space-y-1.5">
          <Label
            htmlFor="endDate"
            className={FORM_LABEL}
          >
            Fim *
          </Label>
          <DateTimePicker
            id="endDate"
            value={endDate ?? null}
            onChange={(value) => {
              if (!value) return;
              form.setValue('endDate', value, {
                shouldDirty: true,
                shouldValidate: true
              });
            }}
            disabled={isSubmitting}
            placeholder="Data e hora de fim"
            error={form.formState.errors.endDate?.message}
          />
        </div>
      </CardContent>
    </Card>
  );
}
