import { z } from 'zod';

import { isPlanId, type PlanId } from '@workspace/billing';

const planIdSchema = z
  .string()
  .refine((value): value is PlanId => isPlanId(value), {
    message: 'Plano inválido'
  }) as z.ZodType<PlanId>;

export const checkoutSchema = z
  .object({
    productId: planIdSchema,
    billingInterval: z.enum(['monthly', 'yearly']).optional()
  })
  .superRefine((data, ctx) => {
    if (data.productId === 'pro' && !data.billingInterval) {
      ctx.addIssue({
        code: z.ZodIssueCode.custom,
        message: 'Intervalo obrigatório para o plano Pro',
        path: ['billingInterval']
      });
    }
  });

export type CheckoutInput = z.infer<typeof checkoutSchema>;
