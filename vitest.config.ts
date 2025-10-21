import { defineConfig } from 'vitest/config';
import path from 'path';
import url from 'url';

const __dirname = path.dirname(url.fileURLToPath(import.meta.url));
const projectRoot = path.resolve(__dirname);

export default defineConfig({
  test: {
    globals: true,
    environment: 'node',
    include: ['tests/**/*.spec.ts'],
    alias: {
      '@': projectRoot,
    },
    reporters: ['default'],
    coverage: {
      reporter: ['text', 'html'],
    },
  },
});
