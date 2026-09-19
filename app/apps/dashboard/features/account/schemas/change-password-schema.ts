import { z } from 'zod';

import { changePasswordActionSchema } from './change-password-action-schema';

export const changePasswordSchema = changePasswordActionSchema
  .extend({
    confirmPassword: z.string().min(1, 'Confirme a nova senha.')
  })
  .refine((data) => data.newPassword === data.confirmPassword, {
    message: 'As senhas não coincidem.',
    path: ['confirmPassword']
  });

export type ChangePasswordFormData = z.infer<typeof changePasswordSchema>;
