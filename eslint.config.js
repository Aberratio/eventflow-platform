import js from '@eslint/js';
import globals from 'globals';
import reactHooks from 'eslint-plugin-react-hooks';
import reactRefresh from 'eslint-plugin-react-refresh';
import tseslint from 'typescript-eslint';
import eslintPluginPrettier from 'eslint-plugin-prettier';

// TD.22 lint-gate baseline: `npm run lint` runs with `--max-warnings 71`
// (see package.json), not 0. As of the TD.22 cleanup (2026-09-21), the
// Prettier-formatting share of warnings (~927) was eliminated mechanically
// via `eslint --fix`, and the flagged EventRegistrationPage.tsx:156
// `react-hooks/exhaustive-deps` risk was fixed for real. The remaining 71
// warnings are honest, pre-existing debt, intentionally left as warnings
// rather than fixed en masse (that would be a large, logic-touching
// undertaking out of scope for one ticket):
//   - 32 @typescript-eslint/no-unused-vars
//   - 17 react-refresh/only-export-components
//   - 12 @typescript-eslint/no-explicit-any
//   -  9 react-hooks/exhaustive-deps (reviewed individually; none flagged
//        as a money/registration-flow risk like the one that was fixed)
//   -  1 @typescript-eslint/no-require-imports
// `--max-warnings 71` is a deliberate ceiling, i.e. a baseline in spirit
// (same idea as the TD.15 PHPStan baseline): it makes `npm run lint` pass
// honestly today and fail if warnings are added ON TOP of this count, so
// the gate keeps functioning instead of being permanently broken. Fixing
// any of these 71 should be its own ticket (with per-file review), and the
// ceiling should be lowered to match as that debt is paid down — never
// raised to accommodate new warnings; new code should not add to this
// count.
export default tseslint.config(
  { ignores: ['dist'] },
  {
    extends: [js.configs.recommended, ...tseslint.configs.recommended],
    files: ['**/*.{ts,tsx}'],
    languageOptions: {
      ecmaVersion: 2020,
      globals: globals.browser,
    },
    plugins: {
      'react-hooks': reactHooks,
      'react-refresh': reactRefresh,
      prettier: eslintPluginPrettier,
    },
    rules: {
      ...reactHooks.configs.recommended.rules,
      'react-refresh/only-export-components': ['warn', { allowConstantExport: true }],

      // Prettier integration
      'prettier/prettier': 'warn',

      // TypeScript — reasonably restrictive
      '@typescript-eslint/no-unused-vars': [
        'warn',
        { argsIgnorePattern: '^_', varsIgnorePattern: '^_', caughtErrorsIgnorePattern: '^_' },
      ],
      '@typescript-eslint/no-explicit-any': 'warn',
      '@typescript-eslint/no-empty-object-type': 'off',
      '@typescript-eslint/no-require-imports': 'warn',

      // General quality
      'no-console': ['warn', { allow: ['warn', 'error'] }],
      'no-debugger': 'error',
      'no-duplicate-imports': 'error',
      'no-self-compare': 'error',
      'no-template-curly-in-string': 'warn',
      eqeqeq: ['error', 'smart'],
      'prefer-const': 'warn',
      'no-var': 'error',
      'object-shorthand': 'warn',
      'prefer-template': 'warn',
    },
  },
);
