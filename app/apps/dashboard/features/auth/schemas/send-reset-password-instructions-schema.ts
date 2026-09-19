import { z } from 'zod';

export const sendResetPasswordInstructionsSchema = z.object({
  email: z
    .string({
      error: (issue) =>
        issue.input === undefined
          ? 'Email obrigatório.'
          : 'O email deve ser texto.'
    })
    .trim()
    .min(1, 'Email obrigatório.')
    .max(255, 'Máximo de 255 caracteres.')
    .email('Digite um email válido.')
});

export type SendResetPasswordInstructionsSchema = z.infer<
  typeof sendResetPasswordInstructionsSchema
>;
