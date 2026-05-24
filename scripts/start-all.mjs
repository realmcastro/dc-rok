#!/usr/bin/env node
/**
 * dc-rok one-shot launcher.
 *
 * 1. Ensure root + desktop dependencies are installed.
 * 2. Ensure Prisma client is generated.
 * 3. Launch the Electron admin panel, which auto-spawns the Discord bot
 *    as a child process via DCROK_AUTO_START=1.
 *
 * Usage:
 *   npm run app              # full setup + launch
 *   npm run app:setup        # install + generate, no launch
 */

import { spawn } from 'node:child_process';
import { existsSync } from 'node:fs';
import { resolve, dirname } from 'node:path';
import { fileURLToPath } from 'node:url';

const __dirname = dirname(fileURLToPath(import.meta.url));
const ROOT = resolve(__dirname, '..');
const DESKTOP = resolve(ROOT, 'desktop');
const setupOnly = process.argv.includes('--setup-only');
const IS_WIN = process.platform === 'win32';
const NPM = IS_WIN ? 'npm.cmd' : 'npm';

function log(msg) {
  process.stdout.write(`[dc-rok] ${msg}\n`);
}

function run(cmd, args, cwd, opts = {}) {
  return new Promise((resolveP, rejectP) => {
    const child = spawn(cmd, args, {
      cwd,
      stdio: 'inherit',
      shell: IS_WIN,
      ...opts,
    });
    child.on('exit', (code) => {
      if (code === 0) resolveP();
      else rejectP(new Error(`${cmd} ${args.join(' ')} exited ${code}`));
    });
    child.on('error', rejectP);
  });
}

async function ensureDeps(label, cwd) {
  const nm = resolve(cwd, 'node_modules');
  if (existsSync(nm)) {
    log(`${label}: node_modules present, skipping install`);
    return;
  }
  log(`${label}: installing dependencies (this can take a minute)…`);
  await run(NPM, ['install'], cwd);
}

async function ensurePrismaClient() {
  const generated = resolve(ROOT, 'node_modules/.prisma/client');
  if (existsSync(generated)) {
    log('prisma: client present, skipping generate');
    return;
  }
  log('prisma: generating client…');
  await run(NPM, ['run', 'db:generate'], ROOT);
}

async function main() {
  log(`root:    ${ROOT}`);
  log(`desktop: ${DESKTOP}`);

  await ensureDeps('root   ', ROOT);
  await ensureDeps('desktop', DESKTOP);
  await ensurePrismaClient();

  if (setupOnly) {
    log('setup complete (--setup-only).');
    return;
  }

  log('launching admin panel + bot…');
  await run(NPM, ['run', 'dev'], DESKTOP, {
    env: { ...process.env, DCROK_AUTO_START: '1' },
  });
}

main().catch((err) => {
  process.stderr.write(`[dc-rok] FATAL: ${err.message}\n`);
  process.exit(1);
});
