import { baseUrl, routes } from '@workspace/routes';

/**
 * O login vive no dashboard, mas outros apps do monorepo mandam o usuário pra
 * lá e precisam recebê-lo de volta. Por isso URL absoluta é aceita quando a
 * origem é de um app conhecido, e recusada em qualquer outro caso: é o que
 * impede open redirect.
 */

export const DEFAULT_REDIRECT_PATH = '/';

function safeOrigin(value: string | undefined): string | null {
  if (!value) return null;
  try {
    return new URL(value).origin;
  } catch {
    return null;
  }
}

export function getTrustedOrigins(): readonly string[] {
  const origins = [
    safeOrigin(baseUrl.dashboard),
    safeOrigin(baseUrl.marketing),
    safeOrigin(baseUrl.aiChat)
  ];
  return Array.from(new Set(origins.filter((o): o is string => o !== null)));
}

export function isTrustedOrigin(origin: string): boolean {
  return getTrustedOrigins().includes(origin);
}

type SanitizeOptions = {
  fallback?: string;
  /** Quando informada, URL absoluta dessa mesma origem vira caminho relativo. */
  currentOrigin?: string;
};

/** Caminho relativo ou URL absoluta confiável; o resto cai no fallback. */
export function sanitizeRedirectTo(
  value: string | null | undefined,
  options: SanitizeOptions = {}
): string {
  const fallback = options.fallback ?? DEFAULT_REDIRECT_PATH;
  const trimmed = value?.trim() ?? '';
  if (!trimmed) return fallback;

  // `//host` e `/\host` viram autoridade no parser de URL, não caminho interno.
  if (/^\/[/\\]/.test(trimmed)) return fallback;
  if (trimmed.startsWith('/')) return trimmed;

  let parsed: URL;
  try {
    parsed = new URL(trimmed);
  } catch {
    return fallback;
  }

  if (parsed.protocol !== 'http:' && parsed.protocol !== 'https:') {
    return fallback;
  }
  if (!isTrustedOrigin(parsed.origin)) return fallback;

  if (options.currentOrigin && parsed.origin === options.currentOrigin) {
    return `${parsed.pathname}${parsed.search}${parsed.hash}`;
  }

  return parsed.toString();
}

export function isExternalRedirect(
  redirectTo: string,
  currentOrigin: string
): boolean {
  if (redirectTo.startsWith('/')) return false;
  try {
    return new URL(redirectTo).origin !== currentOrigin;
  } catch {
    return false;
  }
}

/**
 * O next-auth só redireciona pra mesma origem, então destino confiável de
 * outro app vira `/auth/continue?to=<url>`.
 */
export function toSameOriginRedirect(
  value: string | null | undefined,
  options: SanitizeOptions = {}
): string {
  const currentOrigin = options.currentOrigin ?? safeOrigin(baseUrl.dashboard);
  const target = sanitizeRedirectTo(value, {
    ...options,
    currentOrigin: currentOrigin ?? undefined
  });

  if (!currentOrigin || !isExternalRedirect(target, currentOrigin)) {
    return target;
  }

  return `${routes.dashboard.auth.continue}?${new URLSearchParams({ to: target })}`;
}
