import 'server-only';

import { db, eq, userTable } from '@workspace/database';

export async function getCurrentUser(userId: string) {
  const [user] = await db
    .select({
      id: userTable.id,
      name: userTable.name,
      email: userTable.email,
      image: userTable.image
    })
    .from(userTable)
    .where(eq(userTable.id, userId))
    .limit(1);

  return user ?? null;
}

export async function currentUserEmail(userId: string) {
  const user = await getCurrentUser(userId);
  return user?.email ?? null;
}
