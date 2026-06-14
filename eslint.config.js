import eslint from '@eslint/js'
import tseslint from 'typescript-eslint'
import functional from 'eslint-plugin-functional'
import globals from 'globals'
import localLinter from './linter/index.js'
import eslintConfigPrettier from 'eslint-config-prettier'
import simpleImportSort from 'eslint-plugin-simple-import-sort'

export default tseslint.config(
  eslint.configs.recommended,
  ...tseslint.configs.recommended,
  {
    files: ['src/**/*.ts'],
    plugins: {
      functional,
      local: localLinter,
      'simple-import-sort': simpleImportSort,
    },
    languageOptions: {
      parserOptions: {
        project: './tsconfig.eslint.json',
      },
      globals: {
        ...globals.node,
      },
    },
    rules: {
      'simple-import-sort/imports': 'error',
      'simple-import-sort/exports': 'error',

      // Enforce 'Error as Value' by banning throw statements
      'functional/no-throw-statements': 'error',

      // Additional safety: ensure that if something is thrown, it's an Error object
      '@typescript-eslint/only-throw-error': 'error',

      // Custom rule: Enforce handling of Result types
      'local/no-floating-result': 'error',

      // Forbid 'undefined'
      'no-undefined': 'error',
      curly: ['error', 'multi-line'],
      'no-restricted-syntax': [
        'error',
        {
          selector: 'Identifier[name="undefined"]',
          message: 'Use "null" or a "Result/Option" type instead of "undefined".',
        },
        {
          selector: 'TSUndefinedKeyword',
          message: 'Use "null" or a "Result/Option" type instead of "undefined".',
        },
      ],
    },
  },
  {
    files: ['**/*.test.ts', 'src/tests/**/*.ts'],
    rules: {
      'local/no-floating-result': 'off',
      'functional/no-throw-statements': 'off',
      '@typescript-eslint/no-explicit-any': 'off',
      '@typescript-eslint/no-empty-object-type': 'off',
      '@typescript-eslint/no-unused-vars': 'off',
    },
  },
  {
    // Ignore build artifacts
    ignores: ['dist/**', 'node_modules/**'],
  },
  eslintConfigPrettier
)
