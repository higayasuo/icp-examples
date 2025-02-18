import { defineConfig } from 'vitest/config';
import { resolve } from 'path';

export default defineConfig({
  test: {
    environment: 'jsdom',
    globals: true,
    setupFiles: [resolve(__dirname, './vitest.setup.ts')],
    deps: {
      optimizer: {
        web: {
          include: [
            '@dfinity/agent',
            '@dfinity/auth-client',
            '@dfinity/identity',
            'expo-crypto',
            'react-native',
          ],
        },
      },
    },
  },
  resolve: {
    alias: {
      '@': resolve(__dirname, './'),
    },
  },
});
