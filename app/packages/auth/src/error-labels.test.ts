import { describe, expect, it, vi } from 'vitest';

import { AuthErrorCode } from './error-codes';
import { authErrorLabels, resolveAuthErrorMessage } from './error-labels';

vi.mock('next-auth', () => ({
  CredentialsSignin: class extends Error {}
}));

describe('resolveAuthErrorMessage', () => {
  it('traduz código conhecido de auth', () => {
    expect(
      resolveAuthErrorMessage(AuthErrorCode.IncorrectEmailOrPassword)
    ).toBe(authErrorLabels[AuthErrorCode.IncorrectEmailOrPassword]);
  });

  it('traduz chave crua do next-auth', () => {
    expect(resolveAuthErrorMessage('OAuthAccountNotLinked')).toBeTruthy();
    expect(resolveAuthErrorMessage('OAuthAccountNotLinked')).not.toBe(
      'OAuthAccountNotLinked'
    );
  });

  it('cai no fallback informado quando não conhece o código', () => {
    expect(resolveAuthErrorMessage('nada_disso', 'Erro genérico.')).toBe(
      'Erro genérico.'
    );
  });

  it('tem rótulo para todo código do enum', () => {
    for (const code of Object.values(AuthErrorCode)) {
      expect(authErrorLabels[code]).toBeTruthy();
    }
  });
});
