import { defineConfig } from 'vitest/config';
import tsconfigPaths from 'vite-tsconfig-paths';

// Tell Vitest to look for test files in the specified directory
export default defineConfig({
  plugins: [tsconfigPaths({ projects: ['tsconfig.test.json'] })],
  test: {
    include: ['src/infrastructure/tests/unit/**/*.test.ts'],
    globals: true,
  },
});
