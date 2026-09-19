import { z } from 'zod';

export const updateProfileSchema = z.object({
  name: z
    .string()
    .trim()
    .min(1, 'Nome é obrigatório')
    .max(64, 'Máximo de 64 caracteres.'),
  phone: z.string().trim().max(32, 'Máximo de 32 caracteres.').nullable()
});

export type UpdateProfileInput = z.infer<typeof updateProfileSchema>;
