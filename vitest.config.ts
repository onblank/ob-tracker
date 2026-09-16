import { defineConfig } from 'vitest/config';
import { fileURLToPath } from 'node:url';
const root = fileURLToPath(new URL('.', import.meta.url));
export default defineConfig({
  resolve: { alias: {
    '@obt/domain': `${root}packages/domain/src/index.ts`,
    '@obt/application': `${root}packages/application/src/index.ts`,
    '@obt/contracts': `${root}packages/contracts/src/index.ts`,
    '@obt/db-sqlite': `${root}packages/db-sqlite/src/index.ts`,
    '@obt/import-export': `${root}packages/import-export/src/index.ts`,
    '@obt/settings': `${root}packages/settings/src/index.ts`,
    '@obt/shared': `${root}packages/shared/src/index.ts`
  }},
  test: { include: ['packages/**/*.test.ts', 'apps/**/*.test.ts'], environment: 'node' }
});
