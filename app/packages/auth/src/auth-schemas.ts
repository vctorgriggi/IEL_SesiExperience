import { z } from 'zod';

import { passwordValidator } from './password';

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
