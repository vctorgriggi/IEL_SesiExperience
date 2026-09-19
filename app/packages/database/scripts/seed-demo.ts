import { hash } from 'bcryptjs';

import { db, eq, userTable } from '@workspace/database';

const DEMO_EMAIL = (process.env.DEMO_EMAIL ?? 'demo@arki.dev')
  .trim()
  .toLowerCase();
const DEMO_PASSWORD = process.env.DEMO_PASSWORD ?? 'Demo1234';
const DEMO_NAME = process.env.DEMO_NAME ?? 'Visitante';

const BCRYPT_SALT_LENGTH = 13;

async function main(): Promise<void> {
  const password = await hash(DEMO_PASSWORD, BCRYPT_SALT_LENGTH);

  const [existing] = await db
    .select({ id: userTable.id })
    .from(userTable)
    .where(eq(userTable.email, DEMO_EMAIL))
    .limit(1);

  if (existing) {
    await db
      .update(userTable)
      .set({
        password,
        emailVerified: new Date(),
        completedOnboarding: true
      })
      .where(eq(userTable.id, existing.id));

    console.log(`Conta de demonstração atualizada: ${DEMO_EMAIL}`);
  } else {
    await db.insert(userTable).values({
      name: DEMO_NAME,
      email: DEMO_EMAIL,
      password,
      emailVerified: new Date(),
      completedOnboarding: true,
      locale: 'pt-BR'
    });

    console.log(`Conta de demonstração criada: ${DEMO_EMAIL}`);
  }

  console.log(`Senha: ${DEMO_PASSWORD}`);
}

main()
  .then(() => process.exit(0))
  .catch((error) => {
    console.error(error);
    process.exit(1);
  });
