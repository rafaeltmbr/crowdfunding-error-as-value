import eslint from '@eslint/js';
import tseslint from 'typescript-eslint';
import functional from 'eslint-plugin-functional';
import globals from 'globals';
import localLinter from './linter/index.js';

export default tseslint.config(
	eslint.configs.recommended,
	...tseslint.configs.recommended,
	{
		files: ['src/**/*.ts'],
		plugins: {
			functional,
			local: localLinter,
		},
		languageOptions: {
			parserOptions: {
				project: './tsconfig.json',
			},
			globals: {
				...globals.node,
			},
		},
		rules: {
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
		// Ignore build artifacts
		ignores: ['dist/**', 'node_modules/**'],
	}
);
