import { z } from 'zod';

import { passwordValidator } from '@workspace/auth/password';

export const changePasswordActionSchema = z.object({
  currentPassword: z.string().optional(),
  newPassword: z
    .string()
    .min(1, 'Nova senha é obrigatória.')
    .max(72, 'Máximo de 72 caracteres.')
    .refine((value) => passwordValidator.validate(value).success, {
      message:
        'A senha deve ter maiúsculas, minúsculas, números e pelo menos 8 caracteres.'
    })
});

export type ChangePasswordActionInput = z.infer<
  typeof changePasswordActionSchema
>;
