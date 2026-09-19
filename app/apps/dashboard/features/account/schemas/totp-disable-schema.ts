import { z } from 'zod';

export const totpDisableActionSchema = z.object({
  totpCode: z
    .string()
    .length(6, 'O código deve ter 6 dígitos.')
    .regex(/^\d+$/, 'Apenas números.')
});

export type TotpDisableActionInput = z.infer<typeof totpDisableActionSchema>;
