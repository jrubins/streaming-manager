import { defineConfig } from 'vitest/config';

export default defineConfig({
  test: {
    environment: 'node',
    include: ['test/**/*.test.ts'],
    globalSetup: ['./test/global-setup.ts'],
    // Test files run in parallel against one shared database. That is safe because tests
    // never delete or count other tests' rows: each one creates its own data with unique
    // values (see `unique()` in test/helpers.ts) and asserts only on that data.
  },
});
