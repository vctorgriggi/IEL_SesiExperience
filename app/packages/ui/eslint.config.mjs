import baseConfig from '@workspace/eslint-config/react-internal';

const restrictedClassPatterns = [
  'bg-white',
  'text-neutral-',
  'bg-neutral-',
  'border-neutral-',
  '[font-family:',
  'shadow-[',
  'rounded-[13px]'
];

export default [
  ...baseConfig,
  {
    ignores: [
      'eslint.config.mjs',
      'global.d.ts',
      'postcss.config.js',
      'dist/**',
      'scripts/**'
    ]
  },
  {
    languageOptions: {
      parserOptions: {
        project: './tsconfig.json'
      }
    },
    rules: {
      'no-restricted-syntax': [
        'error',
        {
          selector:
            'JSXAttribute[name.name="style"] > JSXExpressionContainer > ObjectExpression',
          message:
            'Inline visual styles are not allowed in @workspace/ui components. Use semantic tokens or component tokens instead.'
        },
        ...restrictedClassPatterns.map((pattern) => ({
          selector: `Literal[value=/.*${pattern.replace(/[.*+?^${}()|[\]\\]/g, '\\$&')}.*/]`,
          message: `Avoid raw visual class fragment \`${pattern}\` in @workspace/ui. Use semantic tokens instead.`
        }))
      ]
    }
  }
];
