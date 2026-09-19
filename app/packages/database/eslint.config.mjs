import baseConfig from '@workspace/eslint-config/base';

export default [
  ...baseConfig,
  {
    ignores: ['drizzle.config.ts', 'keys.ts', 'scripts/**', 'eslint.config.mjs']
  },
  {
    languageOptions: {
      parserOptions: {
        project: './tsconfig.json'
      }
    }
  }
];
