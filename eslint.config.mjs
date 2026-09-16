import eslint from '@eslint/js';
import tseslint from 'typescript-eslint';

export default tseslint.config(
  { ignores: ['**/node_modules/**','**/dist/**','**/out/**','**/release/**','**/coverage/**','**/playwright-report/**','**/test-results/**'] },
  eslint.configs.recommended,
  { files: ['**/*.{js,mjs,cjs}'], languageOptions: { globals: { process: 'readonly', console: 'readonly', setTimeout: 'readonly', clearTimeout: 'readonly' } } },
  ...tseslint.configs.recommended,
  {
    files: ['**/*.{ts,tsx,mts,cts}'],
    rules: {
      '@typescript-eslint/no-explicit-any': 'error',
      '@typescript-eslint/no-unused-vars': ['error', { argsIgnorePattern: '^_' }],
      '@typescript-eslint/consistent-type-imports': 'error'
    }
  }
);
