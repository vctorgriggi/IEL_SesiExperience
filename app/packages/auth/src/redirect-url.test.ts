import { describe, expect, it } from 'vitest';

import {
  isExternalRedirect,
  isTrustedOrigin,
  sanitizeRedirectTo,
  toSameOriginRedirect
} from './redirect-url';

// As envs de teste apontam os apps pra localhost (ver vitest.setup.ts).
const DASHBOARD = 'http://localhost:3000';
const AI_CHAT = 'http://localhost:3003';

describe('sanitizeRedirectTo', () => {
  it('mantém caminho relativo', () => {
    expect(sanitizeRedirectTo('/chat/abc?x=1')).toBe('/chat/abc?x=1');
  });

  it('cai no fallback com valor vazio', () => {
    expect(sanitizeRedirectTo('')).toBe('/');
    expect(sanitizeRedirectTo(null)).toBe('/');
    expect(sanitizeRedirectTo(undefined, { fallback: '/home' })).toBe('/home');
  });

  it('recusa URL protocol-relative', () => {
    expect(sanitizeRedirectTo('//evil.com/phish')).toBe('/');
  });

  it('recusa barra invertida que o parser normaliza em autoridade', () => {
    expect(sanitizeRedirectTo('/\\evil.com')).toBe('/');
    expect(sanitizeRedirectTo('/\\/evil.com')).toBe('/');
    expect(sanitizeRedirectTo('/\\\\evil.com')).toBe('/');
    expect(new URL(sanitizeRedirectTo('/\\evil.com'), DASHBOARD).origin).toBe(
      DASHBOARD
    );
  });

  it('recusa origem desconhecida', () => {
    expect(sanitizeRedirectTo('https://evil.com/phish')).toBe('/');
  });

  it('recusa protocolo não http(s)', () => {
    expect(sanitizeRedirectTo('javascript:alert(1)')).toBe('/');
  });

  it('aceita URL absoluta de app confiável', () => {
    expect(sanitizeRedirectTo(`${AI_CHAT}/chat/abc`)).toBe(
      `${AI_CHAT}/chat/abc`
    );
  });

  it('converte URL da própria origem em caminho relativo', () => {
    expect(
      sanitizeRedirectTo(`${DASHBOARD}/organizations`, {
        currentOrigin: DASHBOARD
      })
    ).toBe('/organizations');
  });
});

describe('isTrustedOrigin', () => {
  it('reconhece os apps do produto e recusa o resto', () => {
    expect(isTrustedOrigin(DASHBOARD)).toBe(true);
    expect(isTrustedOrigin('https://evil.com')).toBe(false);
  });
});

describe('isExternalRedirect', () => {
  it('caminho relativo nunca é externo', () => {
    expect(isExternalRedirect('/chat', DASHBOARD)).toBe(false);
  });

  it('outra origem é externa', () => {
    expect(isExternalRedirect(`${AI_CHAT}/chat`, DASHBOARD)).toBe(true);
  });
});

describe('toSameOriginRedirect', () => {
  it('destino externo confiável vira bounce por /auth/continue', () => {
    const result = toSameOriginRedirect(`${AI_CHAT}/chat/abc`, {
      currentOrigin: DASHBOARD
    });
    expect(result.startsWith('/auth/continue?to=')).toBe(true);
    expect(decodeURIComponent(result)).toContain(`${AI_CHAT}/chat/abc`);
  });

  it('destino interno passa direto', () => {
    expect(
      toSameOriginRedirect('/organizations', { currentOrigin: DASHBOARD })
    ).toBe('/organizations');
  });

  it('destino hostil cai no fallback, sem bounce', () => {
    expect(
      toSameOriginRedirect('https://evil.com/phish', {
        currentOrigin: DASHBOARD
      })
    ).toBe('/');
  });
});
