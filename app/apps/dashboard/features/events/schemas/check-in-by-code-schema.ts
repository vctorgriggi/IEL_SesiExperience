import { z } from 'zod';

export const checkInByCodeSchema = z.object({
  code: z.string().min(1, 'Código é obrigatório')
});

export type CheckInByCodeInput = z.infer<typeof checkInByCodeSchema>;
