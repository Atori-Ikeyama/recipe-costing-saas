import tsconfigPaths from 'vite-tsconfig-paths';
import { defineConfig } from 'vitest/config';

export default defineConfig({
  plugins: [tsconfigPaths()],
  test: {
    globals: true,
    environment: 'node',
    include: ['src/tests/**/*.spec.ts'],
    reporters: ['default'],
    coverage: {
      reporter: ['text', 'html'],
    },
  },
});
