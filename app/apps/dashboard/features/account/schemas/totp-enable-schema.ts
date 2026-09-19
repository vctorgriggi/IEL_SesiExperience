import { z } from 'zod';

export const totpEnableActionSchema = z.object({
  secret: z.string().min(1, 'Secret é obrigatório.'),
  totpCode: z
    .string()
    .length(6, 'O código deve ter 6 dígitos.')
    .regex(/^\d+$/, 'Apenas números.')
});

export type TotpEnableActionInput = z.infer<typeof totpEnableActionSchema>;
