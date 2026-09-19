import { createEnv } from '@t3-oss/env-nextjs';
import { z } from 'zod';

import { keys as analytics } from '@workspace/analytics/keys';
import { keys as auth } from '@workspace/auth/keys';
import { keys as email } from '@workspace/email/keys';
import { keys as monitoring } from '@workspace/monitoring/keys';
import { keys as routes } from '@workspace/routes/keys';

export const env = createEnv({
  extends: [analytics(), auth(), email(), monitoring(), routes()],
  server: {
    /**
     * As chaves de provider são opcionais individualmente: o app roda só com
     * OpenAI, só com Anthropic, ou com os dois. O seletor de modelos mostra
     * apenas o que estiver configurado. A exigência de ter pelo menos uma
     * chave é validada em `lib/available-models.ts`, que consegue dar uma
     * mensagem melhor do que um erro de env agregado.
     */
    OPENAI_API_KEY: z.string().min(1).optional(),
    ANTHROPIC_API_KEY: z.string().min(1).optional(),
    AI_CHAT_KB_ADMIN_EMAILS: z.string().optional()
  },
  client: {
    NEXT_PUBLIC_THEME_MODE: z
      .enum(['light', 'dark'])
      .optional()
      .default('light')
  },
  runtimeEnv: {
    OPENAI_API_KEY: process.env.OPENAI_API_KEY,
    ANTHROPIC_API_KEY: process.env.ANTHROPIC_API_KEY,
    AI_CHAT_KB_ADMIN_EMAILS: process.env.AI_CHAT_KB_ADMIN_EMAILS,
    NEXT_PUBLIC_THEME_MODE: process.env.NEXT_PUBLIC_THEME_MODE
  },
  emptyStringAsUndefined: true
});

export type ThemeMode = 'light' | 'dark';
