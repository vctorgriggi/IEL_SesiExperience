import 'server-only';

import type { AccountDetails } from '@/features/account/types';

import { getAuthContext } from '@workspace/auth/context';
import { db, eq, userTable } from '@workspace/database';

export async function getAccountDetails(): Promise<AccountDetails | null> {
  const { session } = await getAuthContext();

  const [user] = await db
    .select({
      name: userTable.name,
      phone: userTable.phone,
      image: userTable.image
    })
    .from(userTable)
    .where(eq(userTable.id, session.user.id))
    .limit(1);

  if (!user) return null;

  return {
    name: user.name,
    phone: user.phone ?? null,
    image: user.image ?? null
  };
}
