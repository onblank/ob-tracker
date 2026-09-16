import { defineConfig } from 'vite';
import { resolve } from 'node:path';
import { fileURLToPath } from 'node:url';

const here = fileURLToPath(new URL('.', import.meta.url));

export default defineConfig({
  build: {
    outDir: 'dist/main',
    emptyOutDir: true,
    sourcemap: true,
    lib: { entry: resolve(here, 'src/main/main.ts'), formats: ['es'], fileName: () => 'main.js' },
    rollupOptions: {
      external: (id) => id === 'electron' || id === 'better-sqlite3' || id.startsWith('node:'),
    },
  },
});
