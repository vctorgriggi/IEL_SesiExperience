import { z } from 'zod';

export const resendVerificationEmailSchema = z.object({
  email: z
    .string({
      error: (issue) =>
        issue.input === undefined
          ? 'Email é obrigatório.'
          : 'Email deve ser um texto.'
    })
    .trim()
    .toLowerCase()
    .email('Email inválido.')
});

export type ResendVerificationEmailSchema = z.infer<
  typeof resendVerificationEmailSchema
>;
