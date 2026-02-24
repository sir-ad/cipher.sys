#!/usr/bin/env node

const path = require('path');
const { spawnSync } = require('child_process');
const { printBanner, shouldPrintBanner } = require('../utils/banner');

function parseNpmArgv() {
  try {
    return JSON.parse(process.env.npm_config_argv || '{}');
  } catch (_) {
    return {};
  }
}

function isGlobalInstall() {
  if (String(process.env.npm_config_global || '').toLowerCase() === 'true') return true;
  const npmArgv = parseNpmArgv();
  const original = Array.isArray(npmArgv.original) ? npmArgv.original : [];
  return original.includes('-g') || original.includes('--global');
}

function runCipherUp() {
  const cliPath = path.join(__dirname, '..', 'bin', 'cipher.js');
  const result = spawnSync(process.execPath, [cliPath, 'up'], {
    stdio: 'inherit',
    env: process.env,
  });
  return result.status === 0;
}

function main() {
  if (shouldPrintBanner(process.argv.slice(2), process.env)) {
    printBanner();
  }
  process.stdout.write('[CIPHER] installation complete.\n');

  if (!isGlobalInstall()) {
    process.stdout.write("[CIPHER] local install detected. Run `npx @cipher.sys/terminal` or `node bin/cipher.js up`.\n");
    return;
  }

  process.stdout.write('[CIPHER] global install detected. Bootstrapping daemon with `cipher up`...\n');
  const ok = runCipherUp();
  if (!ok) {
    process.stdout.write('[CIPHER] auto-bootstrap failed. Run `cipher up` manually.\n');
  }
}

main();
