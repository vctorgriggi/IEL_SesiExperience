import nextConfig from '@workspace/eslint-config/next';

/** @type {import("eslint").Linter.Config[]} */
export default [
  ...nextConfig,
  {
    files: ['**/*.ts', '**/*.tsx'],
    rules: {
      'no-restricted-imports': [
        'error',
        {
          patterns: [
            {
              group: ['~/*'],
              message: 'Use @/ for import paths instead of ~/.'
            }
          ]
        }
      ]
    }
  }
];
