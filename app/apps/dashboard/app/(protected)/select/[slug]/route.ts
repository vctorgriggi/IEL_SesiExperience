import { NextResponse, type NextRequest } from 'next/server';
import { getUserOrganizations } from '@/features/organizations/data/get-user-organizations';

import { routes } from '@workspace/routes';

function resolveRedirectTarget(
  request: NextRequest,
  redirectTo: string | null,
  slug: string
): URL {
  if (!redirectTo) {
    return new URL(routes.dashboard.org(slug).home, request.url);
  }

  const candidateUrl = new URL(redirectTo, request.url);
  const requestUrl = new URL(request.url);

  if (candidateUrl.origin !== requestUrl.origin) {
    return new URL(routes.dashboard.org(slug).home, request.url);
  }

  return new URL(
    `${candidateUrl.pathname}${candidateUrl.search}${candidateUrl.hash}`,
    request.url
  );
}

export async function GET(
  request: NextRequest,
  context: { params: Promise<{ slug: string }> }
) {
  const { slug } = await context.params;
  const redirectTo = request.nextUrl.searchParams.get('redirectTo');
  const source = request.nextUrl.searchParams.get('source');
  const organizations = await getUserOrganizations();
  const hasAccessToOrganization = organizations.some(
    (organization) => organization.slug === slug
  );

  if (!hasAccessToOrganization) {
    return NextResponse.redirect(
      new URL(routes.dashboard.onboarding.index, request.url)
    );
  }

  if (source === 'create' && organizations.length === 1) {
    return NextResponse.redirect(
      new URL(routes.dashboard.org(slug).choosePlan, request.url)
    );
  }

  return NextResponse.redirect(
    resolveRedirectTarget(request, redirectTo, slug)
  );
}
