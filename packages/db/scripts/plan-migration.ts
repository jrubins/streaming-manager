// `pnpm --filter @app/db migration:plan --name <slug> [more prisma flags]`
//
// Plans a migration from the latest committed migration to the current contract. Prisma 8
// otherwise needs an explicit origin once migrations exist (`--from`), and the `db` ref it
// would default to tracks a developer's local database, not the committed history.
import { spawnSync } from 'node:child_process';
import { readdirSync } from 'node:fs';
import path from 'node:path';

const packageDir = path.join(import.meta.dirname, '..');
const migrationsDir = path.join(packageDir, 'migrations', 'app');

const args = process.argv.slice(2);
if (!args.includes('--name')) {
  console.error('Usage: pnpm --filter @app/db migration:plan --name <slug>');
  process.exit(1);
}

// Migration folders start with a timestamp (e.g. 20261122T1415_init), so they sort in order.
const latest = readdirSync(migrationsDir, { withFileTypes: true })
  .filter((entry) => entry.isDirectory() && /^\d{8}T\d{4}_/.test(entry.name))
  .map((entry) => entry.name)
  .sort()
  .at(-1);

const from = args.includes('--from') ? [] : ['--from', latest ?? '@empty'];
const result = spawnSync('pnpm', ['prisma', 'migration', 'plan', ...from, ...args], {
  cwd: packageDir,
  stdio: 'inherit',
});
process.exit(result.status ?? 1);
