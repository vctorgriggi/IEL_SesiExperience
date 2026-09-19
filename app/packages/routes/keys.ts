import { createEnv } from '@t3-oss/env-nextjs';
import { z } from 'zod';

export const keys = () =>
  createEnv({
    client: {
      /**
       * Opcional aqui porque o app de chat roda sem o dashboard. Quem depende
       * dela de verdade declara como obrigatória no próprio `env.ts`.
       */
      NEXT_PUBLIC_DASHBOARD_URL: z.string().url().optional(),
      NEXT_PUBLIC_MARKETING_URL: z.string().url().optional(),
      /**
       * URL do app de chat com IA. Serve para o login do dashboard poder
       * devolver o usuário pro chat depois de autenticar.
       */
      NEXT_PUBLIC_AI_CHAT_URL: z.string().url().optional()
    },
    runtimeEnv: {
      NEXT_PUBLIC_DASHBOARD_URL: process.env.NEXT_PUBLIC_DASHBOARD_URL,
      NEXT_PUBLIC_MARKETING_URL: process.env.NEXT_PUBLIC_MARKETING_URL,
      NEXT_PUBLIC_AI_CHAT_URL: process.env.NEXT_PUBLIC_AI_CHAT_URL
    },
    /**
     * Painel de deploy costuma criar a variável vazia "pra preencher depois".
     * Sem isso, `''` passa pelo `.optional()` e quebra no `.url()`.
     */
    emptyStringAsUndefined: true
  });
