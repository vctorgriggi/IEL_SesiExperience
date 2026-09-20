import { NextRequest, NextResponse } from 'next/server';

import { dedupedAuth } from '@workspace/auth';
import { sanitizeRedirectTo } from '@workspace/auth/redirect-url';
import { routes } from '@workspace/routes';

/**
 * Ponte pro destino final depois do login: o next-auth só redireciona pra
 * mesma origem, então quem veio de outro app do produto termina aqui.
 */
export async function GET(request: NextRequest): Promise<Response> {
  const target = sanitizeRedirectTo(request.nextUrl.searchParams.get('to'), {
    fallback: routes.dashboard.painel,
    currentOrigin: request.nextUrl.origin
  });

  const session = await dedupedAuth();
  if (!session) {
    const signIn = new URL(
      routes.dashboard.auth.signIn,
      request.nextUrl.origin
    );
    signIn.searchParams.set('callbackUrl', target);
    return NextResponse.redirect(signIn);
  }

  return NextResponse.redirect(new URL(target, request.nextUrl.origin));
}
