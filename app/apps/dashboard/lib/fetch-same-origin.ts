import 'server-only';

import { headers } from 'next/headers';

import { fetchServerPath } from '@workspace/common/server-fetch';

export async function fetchSameOrigin(
  path: string,
  init?: RequestInit & { organizationSlug?: string }
): Promise<Response> {
  const headersList = await headers();
  const { organizationSlug, ...requestInit } = init ?? {};

  const host = headersList.get('x-forwarded-host') ?? headersList.get('host');
  const proto =
    headersList.get('x-forwarded-proto') ??
    (process.env.NODE_ENV === 'development' ? 'http' : 'https');
  const origin = host
    ? `${proto}://${host}`
    : (process.env.NEXT_PUBLIC_DASHBOARD_URL ?? 'http://localhost:3000');

  return fetchServerPath({
    baseUrl: origin,
    path,
    init: requestInit,
    cookie: headersList.get('cookie'),
    extraHeaders: organizationSlug
      ? { 'x-organization-slug': organizationSlug }
      : undefined
  });
}
