import { execFileSync } from 'node:child_process';
import { fileURLToPath } from 'node:url';

/** Applies migrations to the test database (TEST_DATABASE_URL) once before the test run. */
export default function setup() {
  const url = process.env['TEST_DATABASE_URL'];
  if (!url) throw new Error('TEST_DATABASE_URL is not set (see .env.example)');

  execFileSync('pnpm', ['--filter', '@app/db', 'migrate', '--yes'], {
    cwd: fileURLToPath(new URL('../../..', import.meta.url)),
    env: { ...process.env, DATABASE_URL: url },
    stdio: 'inherit',
  });
}
