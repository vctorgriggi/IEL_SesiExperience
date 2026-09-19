const IP_HEADERS = [
  'cf-connecting-ip',
  'x-real-ip',
  'x-forwarded-for'
] as const;

/**
 * IP do cliente atrás de proxy. `x-forwarded-for` é uma lista onde o primeiro
 * item é o cliente original; os headers são falsificáveis por quem fala direto
 * com o servidor, então só servem para quota de demonstração, nunca para
 * autorização.
 */
export function getClientIp(headers: Headers) {
  for (const name of IP_HEADERS) {
    const value = headers.get(name);
    if (!value) continue;

    const first = value.split(',')[0]?.trim();
    if (first) return first;
  }

  return 'unknown';
}
