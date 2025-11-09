import eslint from '@eslint/js';
import tseslint from 'typescript-eslint';
import globals from 'globals';

export default tseslint.config(
  // Base recommended rules
  eslint.configs.recommended,
  ...tseslint.configs.recommended,

  // Global ignores
  {
    ignores: [
      '**/node_modules/**',
      '**/.next/**',
      '**/playwright-report/**',
      '**/playwright-report-external/**',
      '**/test-results/**',
      '**/coverage/**',
    ],
  },

  // Base rules for all files
  {
    languageOptions: {
      globals: {
        ...globals.node,
        ...globals.browser,
        React: 'readonly',
        NodeJS: 'readonly',
      },
    },
    rules: {
      'no-console': [
        'error',
        {
          allow: ['warn', 'info'],
        },
      ],
      // Relax TypeScript rules for migration
      '@typescript-eslint/no-explicit-any': 'warn',
      '@typescript-eslint/no-unused-vars': [
        'warn',
        {
          argsIgnorePattern: '^_',
          varsIgnorePattern: '^_',
          caughtErrors: 'none',
        },
      ],
      'no-case-declarations': 'warn',
      'no-empty': 'warn',
      'prefer-const': 'warn',
      '@typescript-eslint/ban-ts-comment': 'warn',
      '@typescript-eslint/no-require-imports': 'warn',
      'no-useless-catch': 'warn',
      'no-useless-escape': 'warn',
      'no-duplicate-case': 'warn',
      '@typescript-eslint/triple-slash-reference': 'warn',
      'no-undef': 'warn',
    },
  },

  // Server/API routes: strict no-console
  {
    files: [
      'app/api/**/*.ts',
      'app/**/route.ts',
      'lib/api/**/*.ts',
      'lib/services/**/*.ts',
    ],
    ignores: [
      'app/api/stripe/webhook/**/*.ts',
      'app/api/stripe/webhook/*.ts',
      'app/api/webhooks/**/*.ts',
    ],
    rules: {
      'no-console': ['error'],
    },
  },

  // Webhooks: allow all console (need debug/error logging)
  {
    files: ['app/api/stripe/webhook/**/*.ts', 'app/api/webhooks/**/*.ts'],
    rules: {
      'no-console': 'off',
    },
  },

  // Monitoring/examples: allow console
  {
    files: ['lib/monitoring/**/*.ts', 'lib/examples/**/*.ts'],
    rules: {
      'no-console': 'off',
    },
  },

  // Scripts and tests: allow console
  {
    files: [
      'scripts/**/*.{js,mjs,ts}',
      'tests/**/*.{js,ts}',
      'prisma/**/*.{js,ts}',
    ],
    rules: {
      'no-console': 'off',
    },
  }
);
