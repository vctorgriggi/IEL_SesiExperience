import { z } from 'zod';

import { passwordValidator } from '@workspace/auth/password';

export const signUpSchema = z.object({
  name: z
    .string({
      error: (issue) =>
        issue.input === undefined
          ? 'Nome é obrigatório.'
          : 'Nome deve ser um texto.'
    })
    .trim()
    .min(1, 'Nome é obrigatório.')
    .max(64, 'Máximo de 64 caracteres.'),
  email: z
    .string({
      error: (issue) =>
        issue.input === undefined
          ? 'Email é obrigatório.'
          : 'Email deve ser um texto.'
    })
    .trim()
    .min(1, 'Email é obrigatório.')
    .max(255, 'Máximo de 255 caracteres.')
    .email('Informe um email válido.'),
  password: z
    .string({
      error: (issue) =>
        issue.input === undefined
          ? 'Senha é obrigatória.'
          : 'Senha deve ser um texto.'
    })
    .min(1, 'Senha é obrigatória.')
    .max(72, 'Máximo de 72 caracteres.')
    .refine((arg) => passwordValidator.validate(arg).success, {
      message:
        'A senha deve ter maiúsculas, minúsculas, números e pelo menos 8 caracteres.'
    })
});

export type SignUpSchema = z.infer<typeof signUpSchema>;

export const signUpFormSchema = signUpSchema
  .extend({
    confirmPassword: z
      .string({ error: 'Confirme a senha.' })
      .min(1, 'Confirme a senha.')
  })
  .refine((data) => data.password === data.confirmPassword, {
    message: 'As senhas não coincidem.',
    path: ['confirmPassword']
  });

export type SignUpFormSchema = z.infer<typeof signUpFormSchema>;
