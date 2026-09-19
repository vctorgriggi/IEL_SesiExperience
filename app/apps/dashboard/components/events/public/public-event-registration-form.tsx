'use client';

import { useState } from 'react';
import { registerForEventPublic } from '@/features/events/actions';
import {
  firstValidationError,
  getErrorMessage
} from '@/lib/get-error-message';
import { zodResolver } from '@hookform/resolvers/zod';
import { FormProvider, useForm } from 'react-hook-form';
import { z } from 'zod';

import { Label, NativeSelect, toast } from '@workspace/ui';
import { Button, Input } from '@workspace/ui';

export type PublicTicketTypeOption = {
  id: string;
  name: string;
  priceCents: number;
  quantityAvailable: number | null;
  isVisible: boolean;
};

const publicRegistrationSchema = z.object({
  ticketId: z.string().uuid('Selecione um tipo de ingresso'),
  name: z.string().min(1, 'Nome é obrigatório'),
  email: z.string().email('E-mail inválido')
});

type PublicRegistrationFormValues = z.infer<typeof publicRegistrationSchema>;

type PublicEventRegistrationFormProps = {
  eventSlug: string;
  eventTitle: string;
  ticketTypes: PublicTicketTypeOption[];
};

export function PublicEventRegistrationForm({
  eventSlug,
  eventTitle,
  ticketTypes
}: PublicEventRegistrationFormProps) {
  const [success, setSuccess] = useState(false);

  const visibleTypes = ticketTypes.filter((t) => t.isVisible);
  const hasMultiple = visibleTypes.length > 1;
  const defaultTicketId =
    visibleTypes.length === 1 ? visibleTypes[0]!.id : undefined;

  const form = useForm<PublicRegistrationFormValues>({
    resolver: zodResolver(publicRegistrationSchema),
    defaultValues: {
      ticketId: defaultTicketId ?? '',
      name: '',
      email: ''
    }
  });

  const onSubmit = async (values: PublicRegistrationFormValues) => {
    const ticketId =
      values.ticketId || (visibleTypes.length === 1 ? visibleTypes[0]!.id : '');
    if (!ticketId) {
      toast.error('Selecione um tipo de ingresso.');
      return;
    }
    const result = await registerForEventPublic({
      eventSlug,
      ticketId,
      name: values.name,
      email: values.email
    });
    if (result?.serverError) {
      toast.error(
        getErrorMessage(result.serverError, 'Erro ao se inscrever. Tente novamente.')
      );
      return;
    }
    const validationErr = result?.validationErrors
      ? firstValidationError(result.validationErrors)
      : null;
    if (validationErr) {
      toast.error(
        getErrorMessage(validationErr, 'Erro ao se inscrever. Tente novamente.')
      );
      return;
    }
    const data = result?.data;
    if (data?.code && data?.eventSlug) {
      window.location.href = `/open-events/${data.eventSlug}/confirmation?code=${encodeURIComponent(data.code)}`;
      return;
    }
    setSuccess(true);
    form.reset();
    toast.success('Inscrição realizada! Confira seu ingresso abaixo.');
  };

  if (visibleTypes.length === 0) {
    return (
      <p className="text-sm text-muted-foreground">
        Nenhum tipo de ingresso disponível no momento.
      </p>
    );
  }

  if (success) {
    return (
      <div className="rounded-lg border border-border bg-muted/50 p-4 text-center text-sm text-muted-foreground">
        Você está inscrito em{' '}
        <strong className="text-foreground">{eventTitle}</strong>. Em breve você
        receberá um e-mail com o link do seu ingresso.
      </div>
    );
  }

  return (
    <FormProvider {...form}>
      <form
        onSubmit={form.handleSubmit(onSubmit)}
        className="space-y-4"
      >
        {hasMultiple && (
          <div className="space-y-2">
            <Label>Tipo de ingresso</Label>
            <NativeSelect
              name="ticketId"
              value={form.watch('ticketId')}
              onValueChange={(v) => form.setValue('ticketId', v)}
            >
              <option value="">Selecione</option>
              {visibleTypes.map((t) => (
                <option
                  key={t.id}
                  value={t.id}
                >
                  {t.name}
                  {t.priceCents > 0
                    ? ` — R$ ${(t.priceCents / 100).toFixed(2)}`
                    : ' — Gratuito'}
                </option>
              ))}
            </NativeSelect>
            {form.formState.errors.ticketId?.message && (
              <p className="text-sm text-destructive">
                {form.formState.errors.ticketId.message}
              </p>
            )}
          </div>
        )}

        <div className="space-y-2">
          <Label>Nome</Label>
          <Input
            placeholder="Seu nome"
            {...form.register('name')}
          />
          {form.formState.errors.name?.message && (
            <p className="text-sm text-destructive">
              {form.formState.errors.name.message}
            </p>
          )}
        </div>

        <div className="space-y-2">
          <Label>E-mail</Label>
          <Input
            type="email"
            placeholder="seu@email.com"
            {...form.register('email')}
          />
          {form.formState.errors.email?.message && (
            <p className="text-sm text-destructive">
              {form.formState.errors.email.message}
            </p>
          )}
        </div>

        <Button
          type="submit"
          disabled={form.formState.isSubmitting}
          loading={form.formState.isSubmitting}
        >
          {form.formState.isSubmitting
            ? 'Processando...'
            : 'Confirmar inscrição'}
        </Button>
      </form>
    </FormProvider>
  );
}
