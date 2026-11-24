// One-step local setup after `pnpm install`: `pnpm bootstrap`.
// Safe to run again at any time; every step is idempotent.
//
// 1. Creates .env from .env.example if it doesn't exist
// 2. Checks Docker is running, then starts Postgres and waits until it is healthy
// 3. Applies migrations to the development database
// 4. Installs the Chromium build Playwright needs (end-to-end and Storybook tests)
import { spawnSync } from 'node:child_process';
import { copyFileSync, existsSync } from 'node:fs';
import path from 'node:path';

const root = path.join(import.meta.dirname, '..');

function step(title: string) {
  console.log(`\n▸ ${title}`);
}

function run(command: string, args: string[]) {
  const result = spawnSync(command, args, { cwd: root, stdio: 'inherit' });
  if (result.status !== 0) {
    console.error(`\n✖ Failed: ${command} ${args.join(' ')}`);
    process.exit(result.status ?? 1);
  }
}

step('Environment file');
const envFile = path.join(root, '.env');
if (existsSync(envFile)) {
  console.log('.env already exists, leaving it unchanged');
} else {
  copyFileSync(path.join(root, '.env.example'), envFile);
  console.log('Created .env from .env.example');
}

step('Docker');
if (spawnSync('docker', ['info'], { stdio: 'ignore' }).status !== 0) {
  // Claude Code cloud sessions have Docker installed but don't start its daemon.
  const hint = process.env['CLAUDE_CODE_REMOTE']
    ? 'In this Claude Code cloud session, start it with: (dockerd > /tmp/dockerd.log 2>&1 &)'
    : 'Start Docker Desktop, or on Linux start the Docker daemon.';
  console.error(
    `✖ Docker is not running (or not installed).\n  ${hint}\n  Then run \`pnpm bootstrap\` again.`,
  );
  process.exit(1);
}
console.log('Docker is running');

step('Postgres');
run('docker', ['compose', 'up', '-d', '--wait', 'db']);

step('Migrations (development database)');
run('pnpm', ['--filter', '@app/db', 'migrate', '--yes']);

step('Browser for end-to-end and Storybook tests');
run('pnpm', ['--filter', '@app/e2e', 'install-browsers']);

console.log(
  '\n✔ Ready. Run `pnpm dev` to start the app, or `pnpm check` and `pnpm e2e` to test it.',
);
