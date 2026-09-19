import { createEnv } from '@t3-oss/env-nextjs';
import { z } from 'zod';

import { keys as routes } from '@workspace/routes/keys';

export const env = createEnv({
  extends: [routes()],
  client: {
    NEXT_PUBLIC_MARKETING_URL: z
      .string()
      .min(1, 'NEXT_PUBLIC_MARKETING_URL is required')
      .url(),
    NEXT_PUBLIC_API_URL: z.string().url().optional(),
    NEXT_PUBLIC_THEME_MODE: z
      .enum(['light', 'dark'])
      .optional()
      .default('light')
  },
  runtimeEnv: {
    NEXT_PUBLIC_MARKETING_URL: process.env.NEXT_PUBLIC_MARKETING_URL,
    NEXT_PUBLIC_API_URL: process.env.NEXT_PUBLIC_API_URL,
    NEXT_PUBLIC_THEME_MODE: process.env.NEXT_PUBLIC_THEME_MODE
  },
  emptyStringAsUndefined: true
});

export type ThemeMode = 'light' | 'dark';
