import { defineConfig } from 'vite';

export default defineConfig({
  base: './',
  publicDir: 'assets',
  build: {
    outDir: 'dist',
    emptyOutDir: true,
    //sourcemap: true,
    //minify: false,
    // rollupOptions: {
    //   output: {
    //     format: 'es',
    //   },
    // },
  },
  // resolve: {
  //   alias: {
  //     '@dfinity/agent': '@dfinity/agent/lib/esm/index.js',
  //     '@dfinity/auth-client': '@dfinity/auth-client/lib/esm/index.js',
  //     '@dfinity/identity': '@dfinity/identity/lib/esm/index.js',
  //   },
  // },
});
