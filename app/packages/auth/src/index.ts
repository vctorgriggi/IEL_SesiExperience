import { cache } from 'react';
import NextAuth, { type NextAuthConfig } from 'next-auth';
import { encode } from 'next-auth/jwt';

import { routes } from '@workspace/routes';

import { keys } from '../keys';
import { adapter } from './adapter';
import { callbacks } from './callbacks';
import { getSessionCookieOptions } from './cookies';
import { events } from './events';
import { providers } from './providers';
import { session } from './session';

export const authConfig = {
  adapter,
  providers,
  secret: keys().AUTH_SECRET,
  session,
  pages: {
    signIn: routes.dashboard.auth.signIn,
    signOut: routes.dashboard.auth.signIn,
    error: routes.dashboard.auth.error,
    newUser: routes.dashboard.onboarding.index
  },
  callbacks,
  events,
  cookies: {
    sessionToken: getSessionCookieOptions(keys().AUTH_COOKIE_DOMAIN)
  },
  jwt: {
    maxAge: session.maxAge,
    async encode(arg) {
      return (arg.token?.sessionId as string) ?? encode(arg);
    }
  },
  trustHost: true
} satisfies NextAuthConfig;

export const { handlers, signIn, signOut, auth } = NextAuth(authConfig);

export const dedupedAuth = cache(auth);
