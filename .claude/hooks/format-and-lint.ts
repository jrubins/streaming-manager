// Claude Code PostToolUse hook: after Claude edits a file, format it with Prettier and lint it
// with ESLint (--fix). Remaining lint errors are reported back to Claude (exit code 2) so it
// fixes them right away instead of discovering them at the end.
//
// Input (stdin): the hook event JSON, including tool_input.file_path.
// Runs with Node's built-in type stripping, like the rest of the repo's Node code.
import { spawnSync } from 'node:child_process';
import { existsSync, readFileSync } from 'node:fs';
import path from 'node:path';

interface HookInput {
  tool_input?: { file_path?: string };
}

const projectDir = process.env['CLAUDE_PROJECT_DIR'] ?? process.cwd();
const input = JSON.parse(readFileSync(0, 'utf8')) as HookInput;
const filePath = input.tool_input?.file_path;

// Only files inside this project that still exist (an edit may have been a deletion).
const relative = filePath ? path.relative(projectDir, path.resolve(projectDir, filePath)) : '';
if (!filePath || relative.startsWith('..') || path.isAbsolute(relative) || !existsSync(filePath)) {
  process.exit(0);
}

const bin = (name: string) => path.join(projectDir, 'node_modules', '.bin', name);
const run = (command: string, args: string[]) =>
  spawnSync(bin(command), args, { cwd: projectDir, encoding: 'utf8' });

// Prettier skips unknown file types and anything in .prettierignore.
run('prettier', ['--write', '--ignore-unknown', '--log-level', 'warn', relative]);

if (/\.(ts|tsx)$/.test(relative)) {
  const eslint = run('eslint', ['--fix', '--no-warn-ignored', '--max-warnings', '0', relative]);
  if (eslint.status !== 0) {
    process.stderr.write(
      `ESLint found problems in ${relative} that need fixing:\n${eslint.stdout}${eslint.stderr}`,
    );
    process.exit(2);
  }
}
