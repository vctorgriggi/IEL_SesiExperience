import { defineConfig } from 'vitest/config';
import { resolve } from 'path';

const root = resolve(__dirname, '../..');

export default defineConfig({
  test: {
    globals: true,
    environment: 'node',
    include: ['src/**/*.test.ts', 'src/**/*.spec.ts'],
    exclude: ['**/node_modules/**', '**/dist/**'],
    setupFiles: ['./vitest.setup.ts']
  },
  resolve: {
    alias: [
      {
        find: '@workspace/database/client',
        replacement: resolve(root, 'packages/database/src/client.ts')
      },
      {
        find: '@workspace/database',
        replacement: resolve(root, 'packages/database/src/index.ts')
      }
    ]
  }
});
