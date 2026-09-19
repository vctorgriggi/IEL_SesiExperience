import { describe, expect, it } from 'vitest';

import { getClientIp } from './client-ip';

function headers(values: Record<string, string>): Headers {
  return new Headers(values);
}

describe('getClientIp', () => {
  it('prefere cf-connecting-ip', () => {
    const ip = getClientIp(
      headers({
        'cf-connecting-ip': '1.1.1.1',
        'x-real-ip': '2.2.2.2',
        'x-forwarded-for': '3.3.3.3'
      })
    );
    expect(ip).toBe('1.1.1.1');
  });

  it('usa o primeiro item do x-forwarded-for', () => {
    expect(
      getClientIp(headers({ 'x-forwarded-for': '9.9.9.9, 10.0.0.1, 10.0.0.2' }))
    ).toBe('9.9.9.9');
  });

  it('ignora header presente mas vazio e cai no próximo', () => {
    expect(
      getClientIp(headers({ 'x-real-ip': ' , ', 'x-forwarded-for': '8.8.8.8' }))
    ).toBe('8.8.8.8');
  });

  it('devolve unknown sem nenhum header', () => {
    expect(getClientIp(headers({}))).toBe('unknown');
  });

  it('não quebra com IPv6', () => {
    expect(getClientIp(headers({ 'x-forwarded-for': '2001:db8::1' }))).toBe(
      '2001:db8::1'
    );
  });
});
