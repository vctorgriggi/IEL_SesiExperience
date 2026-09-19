import { z } from 'zod';

import { passwordValidator } from '@workspace/auth/password';

export const resetPasswordSchema = z
  .object({
    requestId: z
      .string({
        error: (issue) =>
          issue.input === undefined
            ? 'Solicitação obrigatória.'
            : 'O identificador da solicitação deve ser texto.'
      })
      .trim()
      .uuid('Solicitação inválida.')
      .min(1, 'Solicitação obrigatória.')
      .max(36, 'Máximo de 36 caracteres.'),
    password: z
      .string({
        error: (issue) =>
          issue.input === undefined
            ? 'Senha obrigatória.'
            : 'A senha deve ser texto.'
      })
      .min(1, 'Senha obrigatória.')
      .max(72, 'Máximo de 72 caracteres.')
      .refine((value) => passwordValidator.validate(value).success, {
        message: 'A senha não atende aos requisitos.'
      }),
    confirmPassword: z
      .string({
        error: (issue) =>
          issue.input === undefined
            ? 'Confirmação obrigatória.'
            : 'A confirmação deve ser texto.'
      })
      .min(1, 'Confirmação obrigatória.')
      .max(72, 'Máximo de 72 caracteres.')
  })
  .refine((values) => values.password === values.confirmPassword, {
    message: 'As senhas não coincidem.',
    path: ['confirmPassword']
  });

export type ResetPasswordSchema = z.infer<typeof resetPasswordSchema>;
