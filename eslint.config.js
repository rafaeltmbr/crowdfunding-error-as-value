import eslint from '@eslint/js'
import tseslint from 'typescript-eslint'
import functional from 'eslint-plugin-functional'
import globals from 'globals'
import importX from 'eslint-plugin-import-x'
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
      'import-x': importX,
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

      // Cyclomatic complexity
      complexity: ['error', 10],

      // Module sizes
      'max-lines': ['error', { max: 300, skipBlankLines: true, skipComments: true }],
      'max-lines-per-function': ['error', { max: 30, skipBlankLines: true, skipComments: true }],
      'max-statements': ['error', { max: 10 }],
      'max-depth': ['error', { max: 1 }],
      'max-params': ['error', { max: 3 }],

      // Dependency structure & Clean Architecture
      'no-restricted-imports': [
        'error',
        {
          patterns: [
            {
              group: ['./*', '../*'],
              message:
                'Relative imports are not allowed. Use alias imports (e.g., @entities/) instead.',
            },
          ],
        },
      ],
      'import-x/no-cycle': 'error',
      'import-x/no-restricted-paths': [
        'error',
        {
          zones: [
            {
              target: './src/domain',
              from: ['./src/app', './src/infra'],
              message:
                'Domain layer cannot depend on Application or Infrastructure layers (Clean Architecture).',
            },
          ],
        },
      ],

      // Enforce a blank line after 'if' and loop statements
      'padding-line-between-statements': [
        'error',
        { blankLine: 'always', prev: ['if', 'switch'], next: '*' },
        { blankLine: 'always', prev: ['for', 'while', 'do'], next: '*' },
      ],

      // Enforce 'Error as Value' by banning throw statements
      'functional/no-throw-statements': 'error',

      // Additional safety: ensure that if something is thrown, it's an Error object
      '@typescript-eslint/only-throw-error': 'error',

      // Custom rule: Enforce handling of Result types
      'local/no-floating-result': 'error',

      // Forbid 'undefined'
      'no-undefined': 'error',
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
      'max-lines-per-function': 'off',
      'max-statements': 'off',
    },
  },
  {
    // Ignore build artifacts
    ignores: ['dist/**', 'node_modules/**'],
  },
  eslintConfigPrettier,
  {
    files: ['src/**/*.ts', '**/*.test.ts'],
    rules: {
      curly: ['error', 'multi-line'],
    },
  }
)
