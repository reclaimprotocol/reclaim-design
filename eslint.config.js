import js from '@eslint/js';
import globals from 'globals';
import tseslint from 'typescript-eslint';

const ignores = [
  '**/dist/**',
  '**/node_modules/**',
  'assets/**',
  'src/oat/**',
  'src/tokens/**',
  'vendor/oat/**',
  'test-results/**',
];

const languageOptions = {
  globals: {
    ...globals.browser,
    ...globals.es2022,
    ...globals.node,
  },
};

const googleRules = {
  'array-callback-return': 'error',
  'block-scoped-var': 'error',
  curly: ['error', 'all'],
  eqeqeq: ['error', 'always'],
  'no-array-constructor': 'error',
  'no-eval': 'error',
  'no-implied-eval': 'error',
  'no-new-func': 'error',
  'no-new-wrappers': 'error',
  'no-throw-literal': 'error',
  'object-shorthand': 'error',
  'prefer-const': 'error',
  'prefer-template': 'error',
  quotes: ['error', 'single', {allowTemplateLiterals: true}],
  semi: ['error', 'always'],
};

export default tseslint.config(
  {ignores},
  {
    ...js.configs.recommended,
    files: ['**/*.{js,mjs}'],
    languageOptions,
    rules: {
      ...js.configs.recommended.rules,
      ...googleRules,
    },
  },
  ...tseslint.configs.recommended.map(config => ({
    ...config,
    files: ['**/*.{ts,tsx}'],
    languageOptions: {
      ...config.languageOptions,
      ...languageOptions,
    },
    rules: {
      ...config.rules,
      ...googleRules,
    },
  })),
);
