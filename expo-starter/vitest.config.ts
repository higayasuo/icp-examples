import { defineConfig } from 'vitest/config';

export default defineConfig({
  test: {
    globals: true,
    //environment: 'jsdom',
  },
  resolve: {
    alias: {
      '@': '/src',
    },
  },
  plugins: [
    {
      name: 'txt',
      transform(code, id) {
        if (id.endsWith('.txt')) {
          return {
            code: `export default ${JSON.stringify(code)};`,
          };
        }
      },
    },
  ],
});