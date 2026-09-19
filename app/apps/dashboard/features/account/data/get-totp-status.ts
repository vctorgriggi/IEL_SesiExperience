import 'server-only';

import { getAuthContext } from '@workspace/auth/context';
import { authenticatorAppTable, db, eq } from '@workspace/database';

export type TotpStatus = { hasTotp: boolean };

export async function getTotpStatus(): Promise<TotpStatus> {
  const { session } = await getAuthContext();
  const [row] = await db
    .select({ id: authenticatorAppTable.id })
    .from(authenticatorAppTable)
    .where(eq(authenticatorAppTable.userId, session.user.id))
    .limit(1);
  return { hasTotp: !!row };
}
