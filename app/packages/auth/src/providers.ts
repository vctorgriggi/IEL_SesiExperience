import { Authenticator } from '@otplib/core';
import { createDigest, createRandomBytes } from '@otplib/plugin-crypto';
import { keyDecoder, keyEncoder } from '@otplib/plugin-thirty-two';
import { isBefore, isValid } from 'date-fns';
import { type NextAuthConfig } from 'next-auth';
import CredentialsProvider from 'next-auth/providers/credentials';
import GoogleProvider from 'next-auth/providers/google';

import { db, eq } from '@workspace/database';
import { authenticatorAppTable, userTable } from '@workspace/database/schema';
import { inMemoryRateLimiter } from '@workspace/rate-limit/in-memory';

import { keys } from '../keys';
import { symmetricDecrypt, symmetricEncrypt } from './encryption';
import {
  IncorrectEmailOrPasswordError,
  IncorrectRecoveryCodeError,
  IncorrectTotpCodeError,
  InternalServerError,
  MissingRecoveryCodesError,
  RateLimitExceededError,
  RequestExpiredError,
  UnverifiedEmailError
} from './errors';
import { verifyPassword } from './password';
import { Provider } from './providers.types';
import {
  logInSchema,
  submitRecoveryCodeSchema,
  submitTotpCodeSchema
} from './schemas';

type CredentialValues = Record<string, unknown>;

type AuthUser = {
  id: string;
  password: string | null;
  email: string | null;
  emailVerified: Date | null;
  name: string | null;
};

function assertCredentialsPresent(
  credentials: CredentialValues | undefined
): asserts credentials is CredentialValues {
  if (!credentials) {
    console.error('For some reason credentials are missing');
    throw new InternalServerError();
  }
}

function assertCredentialIsString(
  value: unknown,
  error: Error
): asserts value is string {
  if (typeof value !== 'string' || value.length === 0) {
    throw error;
  }
}

function assertNotExpired(expiry: Date): void {
  if (!isValid(expiry) || isBefore(expiry, new Date())) {
    throw new RequestExpiredError();
  }
}

function decryptAuthRequest(
  token: string,
  expiry: string,
  key: string
): {
  userId: string;
  expiryDate: Date;
} {
  const userId = symmetricDecrypt(token, key);
  const expiryDate = new Date(symmetricDecrypt(expiry, key));
  assertNotExpired(expiryDate);

  return { userId, expiryDate };
}

async function getUserByEmail(email: string): Promise<AuthUser | null> {
  const [user] = await db
    .select({
      id: userTable.id,
      password: userTable.password,
      email: userTable.email,
      emailVerified: userTable.emailVerified,
      name: userTable.name
    })
    .from(userTable)
    .where(eq(userTable.email, email))
    .limit(1);

  return user ?? null;
}

async function getUserById(userId: string): Promise<AuthUser | null> {
  const [user] = await db
    .select({
      id: userTable.id,
      password: userTable.password,
      email: userTable.email,
      emailVerified: userTable.emailVerified,
      name: userTable.name
    })
    .from(userTable)
    .where(eq(userTable.id, userId))
    .limit(1);

  return user ?? null;
}

function ensureUserWithEmail(
  user: AuthUser | null
): asserts user is AuthUser & {
  email: string;
} {
  if (!user || !user.email) {
    throw new InternalServerError();
  }
}

function parseRecoveryCodes(json: string): Array<string | null> {
  const parsed = JSON.parse(json) as unknown;

  if (!Array.isArray(parsed)) {
    throw new MissingRecoveryCodesError();
  }

  if (!parsed.every((value) => typeof value === 'string' || value === null)) {
    throw new MissingRecoveryCodesError();
  }

  return parsed as Array<string | null>;
}

async function checkRateLimitAndThrowError(
  uniqueIdentifier: string
): Promise<void> {
  const limiter = inMemoryRateLimiter({
    intervalInMs: 60 * 1000 // 1 minute
  });
  const result = await limiter.check(10, uniqueIdentifier); // 10 requests p/ minuto
  if (result.isRateLimited) {
    throw new RateLimitExceededError();
  }
}

export const providers = [
  CredentialsProvider({
    id: Provider.Credentials,
    name: Provider.Credentials,
    credentials: {
      email: { label: 'Email', type: 'text' },
      password: { label: 'Password', type: 'password' }
    },
    async authorize(credentials) {
      assertCredentialsPresent(credentials);
      assertCredentialIsString(
        credentials.email,
        new IncorrectEmailOrPasswordError()
      );
      assertCredentialIsString(
        credentials.password,
        new IncorrectEmailOrPasswordError()
      );

      const result = logInSchema.safeParse(credentials);
      if (!result.success) {
        throw new IncorrectEmailOrPasswordError();
      }

      const parsedCredentials = result.data;
      const normalizedEmail = parsedCredentials.email.toLowerCase();

      await checkRateLimitAndThrowError(normalizedEmail);

      const user = await getUserByEmail(normalizedEmail);
      if (!user || !user.password || !user.email) {
        throw new IncorrectEmailOrPasswordError();
      }

      const isCorrectPassword = await verifyPassword(
        parsedCredentials.password,
        user.password
      );
      if (!isCorrectPassword) {
        throw new IncorrectEmailOrPasswordError();
      }

      if (!user.emailVerified || isBefore(new Date(), user.emailVerified)) {
        throw new UnverifiedEmailError();
      }

      return {
        id: user.id,
        email: user.email,
        name: user.name
      };
    }
  }),
  CredentialsProvider({
    id: Provider.TotpCode,
    name: Provider.TotpCode,
    credentials: {
      token: { label: 'Token', type: 'text' },
      totpCode: { label: 'TOTP code', type: 'text' }
    },
    async authorize(credentials) {
      assertCredentialsPresent(credentials);
      assertCredentialIsString(
        credentials.totpCode,
        new IncorrectTotpCodeError()
      );
      assertCredentialIsString(credentials.token, new IncorrectTotpCodeError());

      const result = submitTotpCodeSchema.safeParse(credentials);
      if (!result.success) {
        throw new IncorrectTotpCodeError();
      }

      const key = keys().AUTH_SECRET;
      const parsedCredentials = result.data;
      const { userId } = decryptAuthRequest(
        parsedCredentials.token,
        parsedCredentials.expiry,
        key
      );

      const user = await getUserById(userId);
      ensureUserWithEmail(user);

      await checkRateLimitAndThrowError(user.email);

      const authenticatorApps = await db
        .select({
          secret: authenticatorAppTable.secret,
          recoveryCodes: authenticatorAppTable.recoveryCodes
        })
        .from(authenticatorAppTable)
        .where(eq(authenticatorAppTable.userId, user.id));

      if (authenticatorApps.length < 1) {
        throw new InternalServerError();
      }

      const secret = symmetricDecrypt(authenticatorApps[0].secret, key);
      if (secret.length !== 32) {
        console.error(
          `Authenticator app secret decryption failed. Expected key with length 32 but got ${secret.length}`
        );
        throw new InternalServerError();
      }

      const authenticator = new Authenticator({
        createDigest,
        createRandomBytes,
        keyDecoder,
        keyEncoder,
        window: [1, 0]
      });
      const isValidToken = authenticator.check(
        parsedCredentials.totpCode,
        secret
      );
      if (!isValidToken) {
        throw new IncorrectTotpCodeError();
      }

      return {
        id: user.id,
        email: user.email,
        name: user.name
      };
    }
  }),
  CredentialsProvider({
    id: Provider.RecoveryCode,
    name: Provider.RecoveryCode,
    credentials: {
      token: { label: 'Token', type: 'text' },
      recoveryCode: { label: 'Recovery code', type: 'text' }
    },
    async authorize(credentials) {
      assertCredentialsPresent(credentials);
      assertCredentialIsString(
        credentials.recoveryCode,
        new IncorrectRecoveryCodeError()
      );
      assertCredentialIsString(
        credentials.token,
        new IncorrectRecoveryCodeError()
      );

      const result = submitRecoveryCodeSchema.safeParse(credentials);
      if (!result.success) {
        throw new IncorrectRecoveryCodeError();
      }

      const key = keys().AUTH_SECRET;
      const parsedCredentials = result.data;
      const { userId } = decryptAuthRequest(
        parsedCredentials.token,
        parsedCredentials.expiry,
        key
      );

      const user = await getUserById(userId);
      ensureUserWithEmail(user);

      await checkRateLimitAndThrowError(user.email);

      const authenticatorApps = await db
        .select({
          recoveryCodes: authenticatorAppTable.recoveryCodes
        })
        .from(authenticatorAppTable)
        .where(eq(authenticatorAppTable.userId, user.id));

      if (authenticatorApps.length < 1) {
        throw new InternalServerError();
      }

      if (!authenticatorApps[0].recoveryCodes) {
        throw new MissingRecoveryCodesError();
      }

      const recoveryCodes = parseRecoveryCodes(
        symmetricDecrypt(authenticatorApps[0].recoveryCodes, key)
      );

      const normalizedRecoveryCode = parsedCredentials.recoveryCode.replaceAll(
        '-',
        ''
      );
      const index = recoveryCodes.indexOf(normalizedRecoveryCode);

      if (index === -1) {
        throw new IncorrectRecoveryCodeError();
      }

      recoveryCodes[index] = null;
      await db
        .update(authenticatorAppTable)
        .set({
          recoveryCodes: symmetricEncrypt(JSON.stringify(recoveryCodes), key)
        })
        .where(eq(authenticatorAppTable.userId, user.id));

      return {
        id: user.id,
        email: user.email,
        name: user.name
      };
    }
  }),
  GoogleProvider({
    id: Provider.Google,
    name: Provider.Google,
    clientId: keys().AUTH_GOOGLE_CLIENT_ID!,
    clientSecret: keys().AUTH_GOOGLE_CLIENT_SECRET!,
    authorization: {
      params: {
        scope: 'openid email profile',
        prompt: 'consent',
        access_type: 'offline',
        response_type: 'code'
      }
    }
  })
] satisfies NextAuthConfig['providers'];
