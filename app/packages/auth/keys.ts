import { createEnv } from '@t3-oss/env-nextjs';
import { z } from 'zod';

export const keys = () =>
  createEnv({
    server: {
      AUTH_SECRET: z.string(),
      /**
       * Domínio do cookie de sessão. Necessário só quando os apps rodam em
       * subdomínios diferentes (ex.: `app.` e `chat.`): sem isso o cookie é
       * host-only e a sessão não atravessa. Use o domínio pai com ponto na
       * frente, ex.: `.seudominio.com`.
       */
      AUTH_COOKIE_DOMAIN: z.string().optional(),
      AUTH_GOOGLE_CLIENT_ID: z.string().optional(),
      AUTH_GOOGLE_CLIENT_SECRET: z.string().optional()
    },
    runtimeEnv: {
      AUTH_SECRET: process.env.AUTH_SECRET,
      AUTH_COOKIE_DOMAIN: process.env.AUTH_COOKIE_DOMAIN,
      AUTH_GOOGLE_CLIENT_ID: process.env.AUTH_GOOGLE_CLIENT_ID,
      AUTH_GOOGLE_CLIENT_SECRET: process.env.AUTH_GOOGLE_CLIENT_SECRET
    },
    emptyStringAsUndefined: true
  });
