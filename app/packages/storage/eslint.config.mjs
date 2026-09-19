import baseConfig from '@workspace/eslint-config/base';

export default [
  ...baseConfig,
  {
    ignores: ['eslint.config.mjs']
  },
  {
    languageOptions: {
      parserOptions: {
        project: './tsconfig.json'
      }
    }
  }
];
