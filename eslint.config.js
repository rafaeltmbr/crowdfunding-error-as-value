import eslint from '@eslint/js';
import tseslint from 'typescript-eslint';
import functional from 'eslint-plugin-functional';
import globals from 'globals';

export default tseslint.config(
	eslint.configs.recommended,
	...tseslint.configs.recommended,
	{
		files: ['src/**/*.ts'],
		plugins: {
			functional,
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
		},
	},
	{
		// Ignore build artifacts
		ignores: ['dist/**', 'node_modules/**'],
	}
);
