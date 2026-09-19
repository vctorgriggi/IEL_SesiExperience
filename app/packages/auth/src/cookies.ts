import { baseUrl } from '@workspace/routes';

const appUrl = baseUrl.dashboard ?? baseUrl.aiChat ?? baseUrl.marketing;
const secure = appUrl ? new URL(appUrl).protocol === 'https:' : false;

export const AuthCookies = {
  CallbackUrl: secure ? '__Secure-authjs.callback-url' : 'authjs.callback-url',
  CsrfToken: secure ? '__Host-authjs.csrf-token' : 'authjs.csrf-token',
  SessionToken: secure
    ? '__Secure-authjs.session-token'
    : 'authjs.session-token'
} as const;

/**
 * Opções do cookie de sessão. O `domain` só entra quando `AUTH_COOKIE_DOMAIN`
 * está definida, caso em que os apps rodam em subdomínios diferentes e
 * precisam compartilhar a sessão. O cookie de CSRF fica de fora: o prefixo
 * `__Host-` proíbe `Domain` por definição.
 */
export function getSessionCookieOptions(domain: string | undefined) {
  return {
    name: AuthCookies.SessionToken,
    options: {
      httpOnly: true,
      sameSite: 'lax',
      path: '/',
      secure,
      ...(domain ? { domain } : {})
    }
  } as const;
}
