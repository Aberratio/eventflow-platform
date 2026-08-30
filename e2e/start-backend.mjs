#!/usr/bin/env node
// E0.4: brings up the PHP API for Playwright's webServer.
//
// Playwright's webServer just runs a shell command and polls a URL/port until
// it responds — it has no notion of "migrate, then seed, then serve". This
// script does that sequencing itself: run migrations and the demo seed
// synchronously (composer scripts defined in zmierzymy_czas_server), then
// exec `composer serve` and stay alive for as long as that process runs, so
// Playwright's webServer keeps treating this script as "the server".
//
// e2e/helpers.ts logs in as accounts seeded by database/seeders/001_demo.sql
// (jan@example.com, marek@timing.pl, monika@zmierzymyczas.pl,
// admin@zmierzymyczas.pl, superadmin@zmierzymyczas.pl, all password
// "demo1234"), so migrate+seed have to run before the API — and before the
// frontend — is considered ready.

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

function runComposer(args) {
  console.log(`[e2e] composer ${args.join(' ')} (cwd: ${serverDir})`);
  execFileSync('composer', args, {
    cwd: serverDir,
    stdio: 'inherit',
    shell: true,
  });
}

try {
  runComposer(['migrate']);
  runComposer(['seed']);
} catch (error) {
  console.error('[e2e] Failed to migrate/seed the backend database.');
  console.error(error?.message ?? error);
  process.exit(1);
}

console.log('[e2e] starting API server (composer serve)');
const serve = spawn('composer', ['serve'], {
  cwd: serverDir,
  stdio: 'inherit',
  shell: true,
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
  console.error(`[e2e] composer serve exited unexpectedly (code=${code}, signal=${signal})`);
  process.exit(code ?? 1);
});

serve.on('error', (error) => {
  console.error('[e2e] Failed to start composer serve.');
  console.error(error);
  process.exit(1);
});
