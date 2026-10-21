#!/usr/bin/env node
// Brings up the PHP API for Playwright's webServer.
//
// Playwright's webServer just runs a shell command and polls a URL/port until
// it responds - it has no notion of "migrate, then seed, then serve". This
// script does that sequencing itself: run `php bin/migrate.php` and
// `php bin/seed.php` synchronously in the server repo, then exec
// `php -S <host>:<port> -t public router.php` (host and port come from
// PLAYWRIGHT_API_URL, default http://127.0.0.1:8081/api/v1) and stay alive for
// as long as that process runs, so Playwright keeps treating this script as
// "the server".
//
// It does NOT create a fresh database: whatever DB the server env points at is
// migrated and seeded as-is. A fresh DB is the caller's job (CI service
// container; locally DROP/CREATE the lane database). The suite mutates state
// (moderation, orders, created drafts), so run it against a fresh seed.
//
// e2e/helpers.ts logs in as accounts seeded by database/seeders/001_demo.sql
// (jan@example.com, marek@timing.pl, monika@zmierzymyczas.pl,
// admin@zmierzymyczas.pl, superadmin@zmierzymyczas.pl, all password
// "demo1234"), so migrate+seed have to run before the API is considered ready.

import { execFileSync, spawn } from 'node:child_process';
import { fileURLToPath } from 'node:url';
import fs from 'node:fs';
import path from 'node:path';

const __dirname = path.dirname(fileURLToPath(import.meta.url));

const serverDir = process.env.PLAYWRIGHT_SERVER_DIR
  ? path.resolve(process.env.PLAYWRIGHT_SERVER_DIR)
  : path.resolve(__dirname, '..', '..', 'zmierzymy_czas_server');

if (!fs.existsSync(path.join(serverDir, 'composer.json'))) {
  console.error(`[e2e] Backend directory not found or missing composer.json: ${serverDir}`);
  console.error('[e2e] Set PLAYWRIGHT_SERVER_DIR to override the default sibling-repo location.');
  process.exit(1);
}

const apiUrl = new URL(process.env.PLAYWRIGHT_API_URL ?? 'http://127.0.0.1:8081/api/v1');
const host = apiUrl.hostname;
const port = apiUrl.port || '8081';

function runPhp(args) {
  console.log(`[e2e] php ${args.join(' ')} (cwd: ${serverDir})`);
  execFileSync('php', args, { cwd: serverDir, stdio: 'inherit' });
}

try {
  runPhp(['bin/migrate.php']);
  runPhp(['bin/seed.php']);
} catch (error) {
  console.error('[e2e] Failed to migrate/seed the backend database.');
  console.error(error?.message ?? error);
  process.exit(1);
}

console.log(`[e2e] starting API server (php -S ${host}:${port})`);
const serve = spawn('php', ['-S', `${host}:${port}`, '-t', 'public', 'router.php'], {
  cwd: serverDir,
  stdio: 'inherit',
});

let shuttingDown = false;
const forwardSignal = (signal) => {
  shuttingDown = true;
  if (!serve.killed) {
    serve.kill(signal);
  }
};
process.on('SIGINT', () => forwardSignal('SIGINT'));
process.on('SIGTERM', () => forwardSignal('SIGTERM'));

serve.on('exit', (code, signal) => {
  if (shuttingDown) {
    process.exit(0);
  }
  console.error(`[e2e] php -S exited unexpectedly (code=${code}, signal=${signal})`);
  process.exit(code ?? 1);
});

serve.on('error', (error) => {
  console.error('[e2e] Failed to start php -S.');
  console.error(error);
  process.exit(1);
});
