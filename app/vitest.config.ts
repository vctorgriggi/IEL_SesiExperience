import { defineConfig } from 'vitest/config';
import { resolve } from 'path';

const root = resolve(__dirname);

export default defineConfig({
  test: {
    globals: true,
    environment: 'node',
    // Alguns testes importam layouts do Next dinamicamente, o que arrasta um
    // grafo grande pelo transform. Sozinho leva menos de 1s; com os pacotes
    // rodando em paralelo passa de 8s e estourava o timeout padrão.
    testTimeout: 30_000,
    hookTimeout: 30_000,
    maxWorkers: process.env.CI ? 2 : undefined,
    pool: 'forks',
    poolOptions: {
      forks: {
        minForks: 1,
        maxForks: process.env.CI ? 2 : 4
      }
    },
    include: [
      'packages/**/*.test.ts',
      'packages/**/*.spec.ts',
      'apps/**/*.test.ts',
      'apps/**/*.spec.ts'
    ],
    exclude: [
      '**/node_modules/**',
      '**/dist/**',
      '**/.next/**',
      '**/e2e/**'
    ],
    coverage: {
      provider: 'v8',
      reporter: ['text', 'json', 'html'],
      include: [
        'packages/ai/src/**',
        'packages/auth/src/**',
        'packages/billing/src/**',
        'packages/common/src/**',
        'packages/routes/src/**',
        'apps/dashboard/features/**'
      ],
      exclude: [
        '**/*.test.ts',
        '**/*.spec.ts',
        '**/__tests__/**',
        '**/*.tsx',
        '**/*.d.ts',
        '**/node_modules/**'
      ],
      // Ratchet: pisos calibrados na cobertura atual para impedir regressão.
      // Ao aumentar a cobertura, suba os valores junto.
      thresholds: {
        lines: 28,
        functions: 45,
        branches: 60,
        statements: 28
      }
    },
    setupFiles: ['./vitest.setup.ts']
  },
  resolve: {
    alias: [
      {
        // `server-only` existe para o bundler barrar import no cliente. Nos
        // testes não há cliente, e o pacote lança ao ser importado, então ele
        // é substituído por um módulo vazio.
        find: /^server-only$/,
        replacement: resolve(root, 'vitest.server-only-stub.ts')
      },
      {
        find: '@workspace/database/client',
        replacement: resolve(root, 'packages/database/src/client.ts')
      },
      {
        find: '@workspace/database',
        replacement: resolve(root, 'packages/database/src/index.ts')
      },
      {
        find: '@/',
        replacement: resolve(root, 'apps/dashboard') + '/'
      }
    ]
  }
});
