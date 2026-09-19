import 'server-only';

import { count, db, eq } from '@workspace/database';
import { accountTable, userTable } from '@workspace/database/schema';

/** Usuário novo = sem onboarding completo e no máximo 1 account. Usado no callback OAuth (intent signin/signup). */
export async function getIsNewUser(userId: string): Promise<boolean | null> {
  const [user] = await db
    .select({
      completedOnboarding: userTable.completedOnboarding,
      accountCount: count(accountTable.userId)
    })
    .from(userTable)
    .leftJoin(accountTable, eq(accountTable.userId, userTable.id))
    .where(eq(userTable.id, userId))
    .groupBy(userTable.id)
    .limit(1);

  if (!user) {
    return null;
  }

  return !user.completedOnboarding && user.accountCount <= 1;
}
