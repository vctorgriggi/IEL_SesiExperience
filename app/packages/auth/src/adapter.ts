import { DrizzleAdapter } from '@auth/drizzle-adapter';

import {
  accountTable,
  sessionTable,
  userTable,
  verificationTokenTable
} from '@workspace/database';
import { db } from '@workspace/database/client';

// Aqui poderíamos modificar o DrizzleAdapter, por exemplo, sobrescrever o método createUser().
// A sugestão é manter o adapter como está e contornar a necessidade, pois ajustes diretos podem exigir manutenção a cada atualização.

export const adapter = Object.freeze(
  DrizzleAdapter(db, {
    usersTable: userTable,
    accountsTable: accountTable,
    sessionsTable: sessionTable,
    verificationTokensTable: verificationTokenTable
  })
);
