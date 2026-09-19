import { hasBasePath } from 'next/dist/client/has-base-path';
import { removeBasePath } from 'next/dist/client/remove-base-path';
import { workUnitAsyncStorage } from 'next/dist/server/app-render/work-unit-async-storage.external';
import { cookies } from 'next/headers';
import { addMinutes } from 'date-fns';

import { routes } from '@workspace/routes';

import { keys } from '../keys';
import { TOTP_AND_RECOVERY_CODES_EXPIRY_MINUTES } from './constants';
import { AuthCookies } from './cookies';
import { symmetricEncrypt } from './encryption';

export function getRedirectToSignIn(): string {
  const path = getRequestStoragePathname();
  const isOrganizationsList =
    path === '/organizations' || path?.startsWith('/organizations?');
  const callbackUrl =
    path && !isOrganizationsList ? path : isOrganizationsList ? '/' : null;

  return callbackUrl
    ? `${routes.dashboard.auth.signIn}?${new URLSearchParams({ callbackUrl })}`
    : routes.dashboard.auth.signIn;
}

export async function getRedirectAfterSignIn(): Promise<string> {
  const cookieStore = await cookies();
  const callbackUrl = cookieStore.get(AuthCookies.CallbackUrl)?.value;
  const slug = cookieStore.get('organizationSlug')?.value;

  const redirectTo = callbackUrl
    ? callbackUrl
    : slug
      ? routes.dashboard.org(slug).home
      : '/';

  return redirectTo;
}

export function getRedirectToTotp(userId: string): string {
  const key = keys().AUTH_SECRET;
  const token = symmetricEncrypt(userId, key);
  const expiry = symmetricEncrypt(
    addMinutes(
      new Date(),
      TOTP_AND_RECOVERY_CODES_EXPIRY_MINUTES
    ).toISOString(),
    key
  );

  return `${routes.dashboard.auth.totp}?token=${encodeURIComponent(token)}&expiry=${encodeURIComponent(expiry)}`;
}

export function getRequestStoragePathname(): string | null {
  const store = workUnitAsyncStorage.getStore();
  if (!store || store.type !== 'request') {
    return null;
  }

  const url = new URL(store.url.pathname + store.url.search, 'http://n');
  if (hasBasePath(url.pathname)) {
    return removeBasePath(url.pathname) + url.search;
  }

  return url.pathname + url.search;
}
