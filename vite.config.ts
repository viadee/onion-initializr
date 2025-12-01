import { defineConfig } from 'vite';
import { nxViteTsPaths } from '@nx/vite/plugins/nx-tsconfig-paths.plugin';

export default defineConfig({
  root: __dirname,
  cacheDir: './node_modules/.vite/root',

  plugins: [nxViteTsPaths()],

  build: {
    outDir: './dist',
    emptyOutDir: true,
    reportCompressedSize: true,
  },
});
