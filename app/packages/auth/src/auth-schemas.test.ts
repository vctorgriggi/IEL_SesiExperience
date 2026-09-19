import { describe, expect, it } from 'vitest';

import {
  passThroughCredentialsSchema,
  resendVerificationEmailSchema,
  resetPasswordSchema,
  sendResetPasswordInstructionsSchema,
  signUpFormSchema,
  signUpSchema
} from './auth-schemas';

const STRONG = 'Senha123';
const UUID = 'f81d4fae-7dec-11d0-a765-00a0c91e6bf6';

describe('signUpSchema', () => {
  it('aceita cadastro válido', () => {
    const parsed = signUpSchema.safeParse({
      name: 'Fulano',
      email: 'a@b.com',
      password: STRONG
    });
    expect(parsed.success).toBe(true);
  });

  it('recusa senha que não passa na política', () => {
    const parsed = signUpSchema.safeParse({
      name: 'Fulano',
      email: 'a@b.com',
      password: 'fraca'
    });
    expect(parsed.success).toBe(false);
  });

  it('recusa email inválido', () => {
    expect(
      signUpSchema.safeParse({
        name: 'Fulano',
        email: 'sem-arroba',
        password: STRONG
      }).success
    ).toBe(false);
  });
});

describe('signUpFormSchema', () => {
  it('exige senhas iguais', () => {
    const base = { name: 'Fulano', email: 'a@b.com', password: STRONG };
    expect(
      signUpFormSchema.safeParse({ ...base, confirmPassword: STRONG }).success
    ).toBe(true);
    expect(
      signUpFormSchema.safeParse({ ...base, confirmPassword: 'Outra123' })
        .success
    ).toBe(false);
  });
});

describe('resetPasswordSchema', () => {
  it('exige requestId uuid e senhas iguais', () => {
    expect(
      resetPasswordSchema.safeParse({
        requestId: UUID,
        password: STRONG,
        confirmPassword: STRONG
      }).success
    ).toBe(true);
    expect(
      resetPasswordSchema.safeParse({
        requestId: 'nao-uuid',
        password: STRONG,
        confirmPassword: STRONG
      }).success
    ).toBe(false);
  });
});

describe('sendResetPasswordInstructionsSchema', () => {
  it('valida o email', () => {
    expect(
      sendResetPasswordInstructionsSchema.safeParse({ email: 'a@b.com' })
        .success
    ).toBe(true);
    expect(
      sendResetPasswordInstructionsSchema.safeParse({ email: 'xx' }).success
    ).toBe(false);
  });
});

describe('mensagens de campo obrigatório', () => {
  it('reporta cada campo ausente com mensagem própria', () => {
    const schemas = [
      signUpSchema,
      signUpFormSchema,
      resetPasswordSchema,
      sendResetPasswordInstructionsSchema,
      passThroughCredentialsSchema,
      resendVerificationEmailSchema
    ];

    for (const schema of schemas) {
      const parsed = schema.safeParse({});
      expect(parsed.success).toBe(false);
      if (parsed.success) continue;
      for (const issue of parsed.error.issues) {
        expect(issue.message).toBeTruthy();
        expect(issue.message).not.toBe('Required');
      }
    }
  });

  it('reporta tipo errado com mensagem própria', () => {
    const parsed = signUpSchema.safeParse({
      name: 1,
      email: 2,
      password: 3
    });
    expect(parsed.success).toBe(false);
    if (!parsed.success) {
      for (const issue of parsed.error.issues) {
        expect(issue.message).toBeTruthy();
      }
    }
  });
});
