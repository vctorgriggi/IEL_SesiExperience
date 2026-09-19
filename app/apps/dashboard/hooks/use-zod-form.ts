'use client';

import { zodResolver } from '@hookform/resolvers/zod';
import {
  useForm,
  type FieldValues,
  type Resolver,
  type UseFormProps,
  type UseFormReturn
} from 'react-hook-form';
import type { z } from 'zod';

/**
 * Wrapper de react-hook-form + Zod.
 *
 * O formulário opera sobre os valores JÁ parseados pelo schema (`z.output`):
 * datas viram `Date`, `.default()` é aplicado, `slug` é derivado, etc. — que é
 * como os componentes de formulário deste app consomem os valores.
 */
export function useZodForm<TSchema extends z.ZodType<FieldValues, FieldValues>>(
  options: Omit<UseFormProps<z.output<TSchema>>, 'resolver'> & {
    schema: TSchema;
  }
): UseFormReturn<z.output<TSchema>> {
  const { schema, ...rest } = options;
  return useForm<z.output<TSchema>>({
    ...rest,
    // zodResolver é tipado pela ENTRADA do schema (z.input); reafirmamos o tipo
    // de saída porque o formulário é modelado sobre os valores parseados.
    resolver: zodResolver(schema) as unknown as Resolver<z.output<TSchema>>
  });
}
