import 'server-only';

import { dedupedAuth } from '@workspace/auth';

export async function getAiChatUserId() {
  const session = await dedupedAuth();
  return session?.user?.id ?? null;
}
