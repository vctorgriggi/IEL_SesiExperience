import { z } from 'zod';

export const passThroughCredentialsSchema = z.object({
  email: z
    .string({
      error: 'Email deve ser um texto.'
    })
    .trim()
    .max(255, 'Máximo de 255 caracteres.'),
  password: z
    .string({
      error: (issue) =>
        issue.input === undefined
          ? 'Senha é obrigatória.'
          : 'Senha deve ser um texto.'
    })
    .max(72, 'Máximo de 72 caracteres.')
});

export type PassThroughCredentialsSchema = z.infer<
  typeof passThroughCredentialsSchema
>;
