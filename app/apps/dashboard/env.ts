import { createEnv } from '@t3-oss/env-nextjs';
import { z } from 'zod';

import { keys as analytics } from '@workspace/analytics/keys';
import { keys as auth } from '@workspace/auth/keys';
import { keys as email } from '@workspace/email/keys';
import { keys as monitoring } from '@workspace/monitoring/keys';
import { keys as routes } from '@workspace/routes/keys';

const allowedOriginsSchema = z
  .string()
  .optional()
  .transform((v) =>
    v
      ? v
          .split(',')
          .map((o) => o.trim())
          .filter(Boolean)
      : undefined
  );

export const env = createEnv({
  extends: [analytics(), auth(), email(), monitoring(), routes()],
  server: {
    CLOUDINARY_CLOUD_NAME: z.string().min(1).optional(),
    CLOUDINARY_API_KEY: z.string().min(1).optional(),
    CLOUDINARY_API_SECRET: z.string().min(1).optional(),
    ALLOWED_ORIGINS: allowedOriginsSchema,
    SECURITY_X_FRAME_OPTIONS: z.enum(['deny', 'sameorigin']).optional(),
    SECURITY_REFERRER_POLICY: z.string().min(1).optional(),
    // Ambas opcionais: a análise assistida da Central IEL (/iel) funciona sem
    // elas, no modo determinístico. Só ativam o modelo real quando as duas
    // estão presentes — veja features/iel-demo/ai/index.ts.
    IEL_AI_PROVIDER: z.enum(['deterministic', 'anthropic']).optional(),
    ANTHROPIC_API_KEY: z.string().min(1).optional()
  },
  client: {
    NEXT_PUBLIC_DASHBOARD_URL: z
      .string()
      .min(1, 'NEXT_PUBLIC_DASHBOARD_URL is required')
      .url(),
    NEXT_PUBLIC_MAPBOX_ACCESS_TOKEN: z.string().min(1).optional(),
    NEXT_PUBLIC_THEME_MODE: z
      .enum(['light', 'dark'])
      .optional()
      .default('light')
  },
  runtimeEnv: {
    NEXT_PUBLIC_DASHBOARD_URL: process.env.NEXT_PUBLIC_DASHBOARD_URL,
    NEXT_PUBLIC_MAPBOX_ACCESS_TOKEN:
      process.env.NEXT_PUBLIC_MAPBOX_ACCESS_TOKEN,
    NEXT_PUBLIC_THEME_MODE: process.env.NEXT_PUBLIC_THEME_MODE,
    CLOUDINARY_CLOUD_NAME: process.env.CLOUDINARY_CLOUD_NAME,
    CLOUDINARY_API_KEY: process.env.CLOUDINARY_API_KEY,
    CLOUDINARY_API_SECRET: process.env.CLOUDINARY_API_SECRET,
    ALLOWED_ORIGINS: process.env.ALLOWED_ORIGINS,
    SECURITY_X_FRAME_OPTIONS: process.env.SECURITY_X_FRAME_OPTIONS,
    SECURITY_REFERRER_POLICY: process.env.SECURITY_REFERRER_POLICY,
    IEL_AI_PROVIDER: process.env.IEL_AI_PROVIDER,
    ANTHROPIC_API_KEY: process.env.ANTHROPIC_API_KEY
  },
  emptyStringAsUndefined: true
});

export type ThemeMode = 'light' | 'dark';
