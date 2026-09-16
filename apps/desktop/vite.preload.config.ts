import { defineConfig } from 'vite';
import { resolve } from 'node:path';
import { fileURLToPath } from 'node:url';

const here = fileURLToPath(new URL('.', import.meta.url));

export default defineConfig({
  build: {
    outDir: 'dist/preload',
    emptyOutDir: true,
    sourcemap: true,
    lib: { entry: resolve(here, 'src/preload/preload.ts'), formats: ['cjs'], fileName: () => 'preload.cjs' },
    rollupOptions: { external: (id) => id === 'electron' || id.startsWith('node:') },
  },
});
