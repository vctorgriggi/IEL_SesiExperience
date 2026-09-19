import 'server-only';

import { headers } from 'next/headers';

import { extractOrganizationSlugFromPathname } from './organization-routing';

/** No servidor (RSC, Server Actions): retorna o slug da org atual. */
export async function getOrganizationSlug(): Promise<string | null> {
  const headerList = await headers();
  const slugFromHeader = headerList.get('x-organization-slug');

  if (slugFromHeader) {
    return slugFromHeader;
  }

  return extractOrganizationSlugFromPathname(headerList.get('x-pathname'));
}

/**
 * Resolve o slug para rotas org-scoped quando ele não está no contexto imediato.
 * Use `explicitSlug` quando já tiver o valor em mãos.
 */
export async function resolveOrgSlugForRouting(
  explicitSlug?: string | null
): Promise<string | null> {
  if (explicitSlug) {
    return explicitSlug;
  }

  return getOrganizationSlug();
}
