export const MAX_SLUG_LENGTH = 255;

export const RESERVED_FIRST_SEGMENTS = new Set([
  'api',
  'auth',
  'calendar',
  'events',
  'home',
  // Mind RH (IEL) mora na raiz: cada primeiro segmento dele é rota do
  // produto, não slug de organização. Sem esta lista o middleware carimbaria
  // `x-organization-slug: vagas`, e uma organização do kit com um desses
  // slugs ficaria inalcançável. `iel` fica pelos links antigos, que redirecionam.
  'acompanhamento',
  'analise-de-aderencia',
  'bi',
  'candidatos',
  'candidatura',
  'consulta',
  'empresas',
  'encaminhamentos',
  'entrar',
  'fontes-de-dados',
  'iel',
  'mapa-de-cultura',
  'painel',
  'pendencias',
  'relatorio',
  'talentos',
  'vagas',
  'invitations',
  'invite',
  'map',
  'onboarding',
  'open-events',
  'organizations',
  'settings',
  'support'
]);

/**
 * Extrai slug de organização do pathname quando o primeiro segmento
 * não é reservado e respeita o limite de tamanho.
 */
export function extractOrganizationSlugFromPathname(
  pathname: string | null
): string | null {
  if (!pathname) {
    return null;
  }

  const [firstSegment] = pathname.split('/').filter(Boolean);

  if (
    !firstSegment ||
    RESERVED_FIRST_SEGMENTS.has(firstSegment) ||
    firstSegment.length > MAX_SLUG_LENGTH
  ) {
    return null;
  }

  return firstSegment;
}

export function hasOrganizationSlug(pathname: string | null): boolean {
  return extractOrganizationSlugFromPathname(pathname) !== null;
}
