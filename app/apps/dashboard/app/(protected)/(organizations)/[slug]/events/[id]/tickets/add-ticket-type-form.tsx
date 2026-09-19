'use client';

import { zodResolver } from '@hookform/resolvers/zod';
import { Controller, FormProvider, useForm } from 'react-hook-form';
import { z } from 'zod';

import { Button, Input, Label } from '@workspace/ui';

const schema = z.object({
  name: z.string().min(1, 'Nome é obrigatório'),
  priceCents: z.number().int().min(0).default(0),
  quantityAvailable: z.union([z.number().int().min(0), z.literal('')]),
  isVisible: z.boolean().default(true)
});

type FormValues = z.input<typeof schema>;
type SubmitValues = {
  name: string;
  priceCents: number;
  quantityAvailable: number | null;
  isVisible: boolean;
};

type AddTicketTypeFormProps = {
  onCancel: () => void;
  onSubmit: (data: SubmitValues) => Promise<unknown>;
  isSubmitting: boolean;
};

export function AddTicketTypeForm({
  onCancel,
  onSubmit,
  isSubmitting
}: AddTicketTypeFormProps) {
  const form = useForm<FormValues>({
    resolver: zodResolver(schema),
    defaultValues: {
      name: '',
      priceCents: 0,
      quantityAvailable: '' as const,
      isVisible: true
    }
  });

  return (
    <FormProvider {...form}>
      <form
        onSubmit={form.handleSubmit(async (data) => {
          await onSubmit({
            name: data.name,
            priceCents: data.priceCents ?? 0,
            quantityAvailable:
              data.quantityAvailable === '' || data.quantityAvailable == null
                ? null
                : Number(data.quantityAvailable),
            isVisible: data.isVisible ?? true
          });
          form.reset();
        })}
        className="flex flex-wrap items-end gap-4"
      >
        <Controller
          control={form.control}
          name="name"
          render={({ field, fieldState }) => (
            <div className="w-[200px] space-y-2">
              <Label>Nome</Label>
              <Input
                placeholder="Ex: Inteira"
                {...field}
              />
              {fieldState.error?.message && (
                <p className="text-sm text-destructive">
                  {fieldState.error.message}
                </p>
              )}
            </div>
          )}
        />
        <Controller
          control={form.control}
          name="priceCents"
          render={({ field, fieldState }) => (
            <div className="w-[120px] space-y-2">
              <Label>Preço (centavos)</Label>
              <Input
                type="number"
                min={0}
                {...field}
                onChange={(e) =>
                  field.onChange(e.target.value ? Number(e.target.value) : 0)
                }
              />
              {fieldState.error?.message && (
                <p className="text-sm text-destructive">
                  {fieldState.error.message}
                </p>
              )}
            </div>
          )}
        />
        <Controller
          control={form.control}
          name="quantityAvailable"
          render={({ field, fieldState }) => (
            <div className="w-[120px] space-y-2">
              <Label>Quantidade</Label>
              <Input
                type="number"
                min={0}
                placeholder="Ilimitado"
                value={
                  field.value === null || field.value === undefined
                    ? ''
                    : field.value
                }
                onChange={(e) =>
                  field.onChange(
                    e.target.value === '' ? '' : Number(e.target.value)
                  )
                }
              />
              {fieldState.error?.message && (
                <p className="text-sm text-destructive">
                  {fieldState.error.message}
                </p>
              )}
            </div>
          )}
        />
        <div className="flex gap-2">
          <Button
            type="submit"
            disabled={isSubmitting}
          >
            {isSubmitting ? 'Salvando...' : 'Salvar'}
          </Button>
          <Button
            type="button"
            outlined
            onClick={onCancel}
          >
            Cancelar
          </Button>
        </div>
      </form>
    </FormProvider>
  );
}
