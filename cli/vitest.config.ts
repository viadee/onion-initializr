import { defineConfig } from 'vitest/config';
import tsconfigPaths from 'vite-tsconfig-paths';

export default defineConfig({
  plugins: [tsconfigPaths()],
  // Run source tests only. Not the compiled test in dist
  test: {
    include: ['src/**/*.test.ts'],
  },
});
