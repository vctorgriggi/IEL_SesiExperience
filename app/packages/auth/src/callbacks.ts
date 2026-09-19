import { cookies } from 'next/headers';
import { isAfter } from 'date-fns';
import type { NextAuthConfig } from 'next-auth';

import { and, db, eq } from '@workspace/database';
import {
  accountTable,
  authenticatorAppTable,
  sessionTable,
  userTable
} from '@workspace/database/schema';
import { routes } from '@workspace/routes';

import { adapter } from './adapter';
import { AuthCookies } from './cookies';
import { AuthErrorCode } from './errors';
import { OAuthProvider, Provider } from './providers.types';
import { getRedirectToTotp } from './redirect';
import { generateSessionToken, getSessionExpiryFromNow } from './session';

function getAuthErrorRedirect(code: AuthErrorCode): string {
  return `${routes.dashboard.auth.error}?error=${code}`;
}

function isSupportedOAuthProvider(provider: string): provider is OAuthProvider {
  return Object.values(OAuthProvider).includes(
    provider.toLowerCase() as OAuthProvider
  );
}

function trimDisplayName(
  name: string | null | undefined
): string | null | undefined {
  return name ? name.substring(0, 64) : name;
}

async function isSignedIn(): Promise<boolean> {
  const cookieStore = await cookies();
  const currentSessionToken = cookieStore.get(AuthCookies.SessionToken)?.value;

  if (!currentSessionToken) {
    return false;
  }

  const [sessionFromDb] = await db
    .select({ expires: sessionTable.expires })
    .from(sessionTable)
    .where(eq(sessionTable.sessionToken, currentSessionToken))
    .limit(1);

  return !!sessionFromDb && isAfter(sessionFromDb.expires, new Date());
}

async function isAuthenticatorAppEnabled(userId: string): Promise<boolean> {
  const [authenticatorApp] = await db
    .select({})
    .from(authenticatorAppTable)
    .where(eq(authenticatorAppTable.userId, userId))
    .limit(1);

  return !!authenticatorApp;
}

async function getTotpRedirectIfEnabled(
  userId: string
): Promise<string | null> {
  if (await isAuthenticatorAppEnabled(userId)) {
    return getRedirectToTotp(userId);
  }

  return null;
}

async function handleCredentialsSignIn(
  user: { id?: string } | undefined,
  provider: string
): Promise<boolean | string> {
  if (!user?.id) {
    return false;
  }

  if (provider === Provider.Credentials) {
    const totpRedirect = await getTotpRedirectIfEnabled(user.id);
    if (totpRedirect) {
      return totpRedirect;
    }
  }

  const sessionToken = generateSessionToken();
  const sessionExpiry = getSessionExpiryFromNow();

  const createdSession = await adapter.createSession!({
    sessionToken,
    userId: user.id,
    expires: sessionExpiry
  });

  if (!createdSession) {
    return false;
  }

  const cookieStore = await cookies();
  cookieStore.set({
    name: AuthCookies.SessionToken,
    value: sessionToken,
    expires: sessionExpiry
  });

  return true;
}

async function resolveOAuthSignInDecision(params: {
  signedIn: boolean;
  existingOAuthAccountUserId: string | null;
  profileEmail: string | null;
}): Promise<string | null> {
  const { signedIn, existingOAuthAccountUserId, profileEmail } = params;

  if (signedIn) {
    if (existingOAuthAccountUserId) {
      return `${routes.dashboard.index}?error=${AuthErrorCode.AlreadyLinked}`;
    }

    return null;
  }

  if (existingOAuthAccountUserId) {
    return getTotpRedirectIfEnabled(existingOAuthAccountUserId);
  }

  if (!profileEmail) {
    return getAuthErrorRedirect(AuthErrorCode.MissingOAuthEmail);
  }

  const [existingUserByEmail] = await db
    .select({ id: userTable.id })
    .from(userTable)
    .where(eq(userTable.email, profileEmail.toLowerCase()))
    .limit(1);

  if (existingUserByEmail) {
    return getAuthErrorRedirect(AuthErrorCode.RequiresExplicitLinking);
  }

  return null;
}

export const callbacks = {
  async signIn({ user, account, profile }): Promise<string | boolean> {
    if (!account) {
      return false;
    }

    if (account.type === 'credentials') {
      return handleCredentialsSignIn(user, account.provider);
    }

    if (!account.provider || !profile) {
      return false;
    }

    if (!isSupportedOAuthProvider(account.provider)) {
      return getAuthErrorRedirect(AuthErrorCode.IllegalOAuthProvider);
    }

    if (account.provider === OAuthProvider.Google && !profile.email_verified) {
      return getAuthErrorRedirect(AuthErrorCode.UnverifiedEmail);
    }

    const [existingOAuthAccount] = await db
      .select({
        userId: accountTable.userId
      })
      .from(accountTable)
      .where(
        and(
          eq(accountTable.provider, account.provider),
          eq(accountTable.providerAccountId, account.providerAccountId)
        )
      )
      .limit(1);

    const decision = await resolveOAuthSignInDecision({
      signedIn: await isSignedIn(),
      existingOAuthAccountUserId: existingOAuthAccount?.userId ?? null,
      profileEmail: profile.email ?? null
    });

    if (decision) {
      return decision;
    }

    if (user) {
      user.name = trimDisplayName(user.name) ?? null;
    }
    if (profile) {
      profile.name = trimDisplayName(profile.name) ?? null;
    }

    return true;
  },
  async jwt({ token, trigger, account, user }) {
    if ((trigger === 'signIn' || trigger === 'signUp') && account) {
      token.accessToken = account.access_token;

      if (account.type === 'credentials' && user.id) {
        const expires = getSessionExpiryFromNow();
        const sessionToken = generateSessionToken();

        const session = await adapter.createSession!({
          userId: user.id,
          sessionToken,
          expires
        });

        token.sessionId = session.sessionToken;
      }
    }

    if (trigger === 'update') {
      return token;
    }

    return token;
  },
  async session({ trigger, session, user }) {
    if (session && user) {
      session.user.id = user.id;
    }

    if (trigger === 'update') {
      return session;
    }

    return session;
  }
} satisfies NextAuthConfig['callbacks'];
