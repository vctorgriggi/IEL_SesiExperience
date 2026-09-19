import { NextResponse, type NextRequest } from 'next/server';
import { extractOrganizationSlugFromPathname } from '@/features/organizations/routing/organization-routing';

function getAllowedOrigins(): string[] {
  const raw = process.env.ALLOWED_ORIGINS;
  if (raw?.trim()) {
    return raw
      .split(',')
      .map((o) => o.trim())
      .filter(Boolean);
  }

  const dashboard = process.env.NEXT_PUBLIC_DASHBOARD_URL;
  return dashboard ? [dashboard] : [];
}

function applyCors(
  request: NextRequest,
  response: NextResponse,
  allowedOrigins: string[]
): NextResponse {
  const origin = request.headers.get('origin');
  const allowOrigin = origin && allowedOrigins.includes(origin) ? origin : null;

  if (allowOrigin) {
    response.headers.set('Access-Control-Allow-Origin', allowOrigin);
    response.headers.set('Access-Control-Allow-Credentials', 'true');
  }

  response.headers.set(
    'Access-Control-Allow-Methods',
    'GET, POST, PUT, PATCH, DELETE, OPTIONS'
  );
  response.headers.set(
    'Access-Control-Allow-Headers',
    'Content-Type, Authorization, x-organization-slug'
  );
  response.headers.set('Access-Control-Max-Age', '86400');

  return response;
}

export function middleware(request: NextRequest): NextResponse<unknown> {
  const path = request.nextUrl.pathname;
  const firstSegment = path.split('/').filter(Boolean)[0];

  const isApi = firstSegment === 'api';
  const allowedOrigins = getAllowedOrigins();

  if (isApi && request.method === 'OPTIONS') {
    const res = new NextResponse(null, { status: 204 });
    return applyCors(request, res, allowedOrigins);
  }

  const slug = extractOrganizationSlugFromPathname(path);
  const response = NextResponse.next();

  response.headers.set('x-pathname', path);
  if (slug) {
    response.headers.set('x-organization-slug', slug);
  }

  if (isApi && allowedOrigins.length > 0) {
    applyCors(request, response, allowedOrigins);
  }

  return response;
}

export const config = {
  matcher: ['/((?!_next|favicon|.*\\.(?:ico|png|svg|woff2?)).*)']
};
