import 'server-only';

import { and, db, eq, gte } from '@workspace/database';
import { changeEmailRequestTable, userTable } from '@workspace/database/schema';

export async function confirmChangeEmailRequest(
  requestId: string
): Promise<{ email: string } | null> {
  const now = new Date();
  const [request] = await db
    .select({
      id: changeEmailRequestTable.id,
      userId: changeEmailRequestTable.userId,
      email: changeEmailRequestTable.email
    })
    .from(changeEmailRequestTable)
    .where(
      and(
        eq(changeEmailRequestTable.id, requestId),
        eq(changeEmailRequestTable.valid, true),
        gte(changeEmailRequestTable.expires, now)
      )
    )
    .limit(1);

  if (!request) {
    return null;
  }

  await db.transaction(async (tx) => {
    await tx
      .update(userTable)
      .set({
        email: request.email,
        emailVerified: new Date()
      })
      .where(eq(userTable.id, request.userId));

    await tx
      .delete(changeEmailRequestTable)
      .where(eq(changeEmailRequestTable.id, request.id));
  });

  return { email: request.email };
}
