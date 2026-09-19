'use server';

import { signOut } from '@workspace/auth';
import { routes } from '@workspace/routes';

export async function signOutAction() {
  await signOut({ redirectTo: routes.aiChat.signIn });
}
