import { resolve } from 'node:path';

import { defineConfig } from 'vitest/config';

export default defineConfig({
  resolve: {
    alias: {
      '@': resolve(__dirname, 'src'),
    },
  },
  test: {
    globals: false,
    environment: 'node',
    clearMocks: true,
    restoreMocks: true,
    pool: 'threads',
    include: ['src/**/*.test.ts'],
    exclude: ['src/**/*.int.test.ts', 'src/**/*.e2e.test.ts'],
  },
});
