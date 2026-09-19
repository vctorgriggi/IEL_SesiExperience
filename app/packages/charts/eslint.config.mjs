import baseConfig from '@workspace/eslint-config/react-internal';

export default [
  ...baseConfig,
  { ignores: ['eslint.config.mjs'] },
  {
    languageOptions: {
      parserOptions: {
        project: './tsconfig.json',
      },
    },
  },
];
