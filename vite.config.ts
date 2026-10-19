import { defineConfig } from 'vite';
import tsconfigPaths from 'vite-tsconfig-paths';

export default defineConfig({
  root: __dirname,
  cacheDir: './node_modules/.vite/root',

  plugins: [tsconfigPaths()],

  build: {
    outDir: './dist',
    emptyOutDir: true,
    reportCompressedSize: true,
  },
});
