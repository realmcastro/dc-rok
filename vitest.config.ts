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
    projects: [
      {
        extends: true,
        test: {
          name: 'unit',
          include: ['src/**/*.test.ts'],
          exclude: ['src/**/*.int.test.ts', 'src/**/*.e2e.test.ts'],
        },
      },
      {
        extends: true,
        test: {
          name: 'integration',
          include: ['src/**/*.int.test.ts'],
        },
      },
      {
        extends: true,
        test: {
          name: 'e2e',
          include: ['tests/e2e/**/*.e2e.test.ts'],
        },
      },
    ],
  },
});
