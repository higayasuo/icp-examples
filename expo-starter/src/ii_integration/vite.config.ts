import { defineConfig } from 'vite';
import { viteSingleFile } from "vite-plugin-singlefile";

export default defineConfig({
  publicDir: 'assets',
  plugins: [
    viteSingleFile()
  ],
  build: {
    outDir: 'dist',
    emptyOutDir: true,
    copyPublicDir: true,
    rollupOptions: {
      output: {
        assetFileNames: '[name][extname]'
      }
    }
  }
});