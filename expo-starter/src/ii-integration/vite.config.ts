import { defineConfig } from 'vite';

export default defineConfig({
  base: './',
  publicDir: 'assets',
  build: {
    outDir: 'dist',
    emptyOutDir: true,
    //sourcemap: true,
    //minify: false
  }
});