import js from '@eslint/js';
import prettier from 'eslint-config-prettier';
import type { Linter } from 'eslint';
import { defineConfig, globalIgnores } from 'eslint/config';
import reactHooks from 'eslint-plugin-react-hooks';
import reactRefresh from 'eslint-plugin-react-refresh';
import storybook from 'eslint-plugin-storybook';
import globals from 'globals';
import tseslint from 'typescript-eslint';

// ---------------------------------------------------------------------------------------------
// Architecture boundaries (see AGENTS.md). Each area lists every import restriction that applies
// to it, because when several config blocks set the same rule, the last matching block wins.
// ---------------------------------------------------------------------------------------------

interface ImportRestriction {
  group?: string[];
  regex?: string;
  /** Restrict only these named imports from the matched modules. */
  importNames?: string[];
  message: string;
}

const everywhere: ImportRestriction[] = [
  {
    regex: String.raw`^(\.\./)+(apps|packages)/`,
    message: 'Import workspace packages by name (@app/shared, @app/db), not by relative path.',
  },
];

const nodeOnly: ImportRestriction[] = [
  ...everywhere,
  {
    group: ['react', 'react-dom', '@tanstack/*', '@app/web'],
    message: 'Browser libraries and web code do not belong in Node code.',
  },
];

const api: ImportRestriction[] = [...nodeOnly];

const e2e: ImportRestriction[] = [
  ...nodeOnly,
  {
    group: ['@app/db', '@app/api', 'pg', '@prisma/*'],
    message: 'End-to-end tests use the UI and the HTTP API, never the database directly.',
  },
];

const apiRoutes: ImportRestriction[] = [
  ...api,
  {
    group: ['@app/db', 'pg', '@prisma/*'],
    message: 'Route handlers call services; only services (and app.ts) use the database.',
  },
];

const apiServices: ImportRestriction[] = [
  ...api,
  {
    group: ['express'],
    message: 'Services are HTTP-agnostic. Throw HttpError for expected failures instead.',
  },
];

const e2eSpecs: ImportRestriction[] = [
  ...e2e,
  {
    group: ['@playwright/test'],
    importNames: ['test', 'expect'],
    message: 'Import test and expect from ./fixtures.ts: its page fixture fails on console errors.',
  },
];

const shared: ImportRestriction[] = [
  ...everywhere,
  {
    group: ['@app/*', 'node:*', 'express', 'pg', '@prisma/*', 'react', 'react-dom', '@tanstack/*'],
    message: '@app/shared is the API contract: it may only depend on zod.',
  },
];

const db: ImportRestriction[] = [
  ...nodeOnly,
  {
    group: ['@app/*', 'express'],
    message: '@app/db is the data layer: it must not depend on other workspace packages or HTTP.',
  },
];

const web: ImportRestriction[] = [
  ...everywhere,
  {
    group: ['@app/db', '@app/api', 'express', 'pg', '@prisma/*', '@sentry/node', 'node:*'],
    message: 'Browser code may only use @app/shared from the workspace, and no Node modules.',
  },
];

const webRoutes: ImportRestriction[] = [
  ...web,
  {
    group: ['@/components/ui/*', '@/lib/api', 'react'],
    message:
      'Route files only declare routing: import the page component and its query options. ' +
      'UI belongs in src/pages, src/features or src/components.',
  },
];

const restrictImports = (patterns: ImportRestriction[]): Linter.RulesRecord => ({
  '@typescript-eslint/no-restricted-imports': ['error', { patterns }],
});

export default defineConfig([
  globalIgnores([
    '**/dist',
    '**/coverage',
    '**/storybook-static',
    '**/.vercel',
    '**/routeTree.gen.ts',
    '**/test-results',
    '**/playwright-report',
    'packages/db/migrations',
    // Agent skills linked from dependencies by pnpm (third-party files).
    '.claude/skills',
    'packages/db/src/contract.d.ts',
  ]),

  // No inline escape hatches: `eslint-disable` comments are not honoured, and stale ones fail.
  { linterOptions: { noInlineConfig: true, reportUnusedDisableDirectives: 'error' } },

  // Type-aware rules for all TypeScript (uses the `typescript` 6 package; see README).
  {
    files: ['**/*.{ts,tsx}'],
    extends: [js.configs.recommended, tseslint.configs.recommendedTypeChecked],
    languageOptions: {
      parserOptions: { projectService: true, tsconfigRootDir: import.meta.dirname },
    },
    rules: {
      '@typescript-eslint/consistent-type-imports': 'error',
      // No @ts-ignore / @ts-expect-error / @ts-nocheck: fix the types instead.
      '@typescript-eslint/ban-ts-comment': [
        'error',
        { 'ts-ignore': true, 'ts-expect-error': true, 'ts-nocheck': true, 'ts-check': false },
      ],
      ...restrictImports(everywhere),
    },
  },

  {
    files: ['apps/api/**', 'apps/e2e/**', 'packages/**', '*.ts', 'scripts/**', '.claude/**'],
    languageOptions: { globals: globals.node },
  },

  // --- API: routes → services → database --------------------------------------------------
  { files: ['apps/api/**/*.ts'], rules: restrictImports(api) },

  // --- End-to-end tests: drive the app through the browser and the public API only --------
  { files: ['apps/e2e/**/*.ts'], rules: restrictImports(e2e) },
  {
    files: ['apps/e2e/tests/**/*.ts'],
    ignores: ['apps/e2e/tests/fixtures.ts'],
    rules: restrictImports(e2eSpecs),
  },
  { files: ['apps/api/src/features/**/*.routes.ts'], rules: restrictImports(apiRoutes) },
  { files: ['apps/api/src/features/**/*.service.ts'], rules: restrictImports(apiServices) },

  // --- Packages ---------------------------------------------------------------------------
  { files: ['packages/shared/**/*.ts'], rules: restrictImports(shared) },
  { files: ['packages/db/**/*.ts'], rules: restrictImports(db) },

  // --- Web --------------------------------------------------------------------------------
  {
    files: ['apps/web/**/*.{ts,tsx}'],
    extends: [reactHooks.configs.flat['recommended-latest'], reactRefresh.configs.vite],
    languageOptions: { globals: globals.browser },
    rules: {
      // Fast Refresh keeps component state only for files that export just components.
      // Allowed exceptions: TanStack Router's `Route` (its Vite plugin splits the component
      // out) and shadcn's style variants exported next to their component.
      'react-refresh/only-export-components': [
        'error',
        { allowExportNames: ['Route', 'buttonVariants', 'badgeVariants'] },
      ],
    },
  },
  // Browser code (the Vite and Storybook config files run in Node, so they are not included).
  {
    files: ['apps/web/src/**/*.{ts,tsx}', 'apps/web/.storybook/preview.tsx'],
    rules: restrictImports(web),
  },
  { files: ['apps/web/src/routes/**/*.{ts,tsx}'], rules: restrictImports(webRoutes) },
  {
    files: ['apps/web/vite.config.ts', 'apps/web/.storybook/main.ts'],
    languageOptions: { globals: globals.node },
  },
  {
    // All HTTP goes through apiRequest (src/lib/api.ts), which validates responses.
    files: ['apps/web/src/{pages,features,components,routes}/**/*.{ts,tsx}'],
    rules: {
      'no-restricted-globals': [
        'error',
        { name: 'fetch', message: 'Use apiRequest from @/lib/api (validates the response).' },
        { name: 'XMLHttpRequest', message: 'Use apiRequest from @/lib/api.' },
      ],
    },
  },

  // eslint-plugin-storybook 10.6 types its rules against older ESLint typings than ESLint 10's;
  // the config itself is valid at runtime.
  storybook.configs['flat/recommended'] as unknown as Linter.Config[],

  // Must stay last: turns off rules that conflict with Prettier.
  prettier,
]);
