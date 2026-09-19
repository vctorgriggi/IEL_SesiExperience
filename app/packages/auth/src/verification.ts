import { addHours } from 'date-fns';

import { and, db, eq, gte } from '@workspace/database';
import {
  changeEmailRequestTable,
  resetPasswordRequestTable,
  userTable,
  verificationTokenTable
} from '@workspace/database/schema';

import { keys } from '../keys';
import { EMAIL_VERIFICATION_EXPIRY_HOURS } from './constants';

async function createHash(message: string): Promise<string> {
  const data = new TextEncoder().encode(message);
  const hash = await crypto.subtle.digest('SHA-256', data);
  return Array.from(new Uint8Array(hash))
    .map((b) => b.toString(16).padStart(2, '0'))
    .join('')
    .toString();
}

function randomString(size: number): string {
  const i2hex = (i: number) => ('0' + i.toString(16)).slice(-2);
  const r = (a: string, i: number): string => a + i2hex(i);
  const bytes = crypto.getRandomValues(new Uint8Array(size));
  return Array.from(bytes).reduce(r, '');
}

export async function createOtpTokens(
  email: string
): Promise<{ otp: string; hashedOtp: string }> {
  const key = keys().AUTH_SECRET;
  const otp = randomString(3).toUpperCase();
  const hashedOtp = await createHash(`${otp}${key}`);

  await db.insert(verificationTokenTable).values({
    identifier: email,
    token: hashedOtp,
    expires: addHours(new Date(), EMAIL_VERIFICATION_EXPIRY_HOURS)
  });

  return { otp, hashedOtp };
}

export async function findVerificationTokenFromOtp(
  otp: string
): Promise<{ identifier: string; expires: Date } | undefined> {
  const key = keys().AUTH_SECRET;
  const hashedOtp = await createHash(`${otp.toUpperCase()}${key}`);
  const [verificationToken] = await db
    .select({
      identifier: verificationTokenTable.identifier,
      expires: verificationTokenTable.expires
    })
    .from(verificationTokenTable)
    .where(eq(verificationTokenTable.token, hashedOtp))
    .limit(1);

  return verificationToken;
}

export async function findVerificationTokenByToken(
  token: string
): Promise<{ identifier: string } | undefined> {
  const now = new Date();
  const [row] = await db
    .select({ identifier: verificationTokenTable.identifier })
    .from(verificationTokenTable)
    .where(
      and(
        eq(verificationTokenTable.token, token),
        gte(verificationTokenTable.expires, now)
      )
    )
    .limit(1);

  return row;
}

export async function findIdentifierByVerificationToken(
  token: string
): Promise<string | undefined> {
  const [row] = await db
    .select({ identifier: verificationTokenTable.identifier })
    .from(verificationTokenTable)
    .where(eq(verificationTokenTable.token, token))
    .limit(1);

  return row?.identifier;
}

export async function verifyEmail(email: string): Promise<void> {
  await db.transaction(async (trx) => {
    await trx
      .update(verificationTokenTable)
      .set({ expires: new Date(0) })
      .where(eq(verificationTokenTable.identifier, email));

    await trx
      .delete(changeEmailRequestTable)
      .where(eq(changeEmailRequestTable.email, email));

    await trx
      .delete(resetPasswordRequestTable)
      .where(eq(resetPasswordRequestTable.email, email));

    await trx
      .update(userTable)
      .set({ emailVerified: new Date() })
      .where(eq(userTable.email, email));
  });
}
