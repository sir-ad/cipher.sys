#!/usr/bin/env node

/**
 * CIPHER.SYS LOCAL LAUNCHER // V4 PHOENIX PROTOCOL
 * Executes the ghost protocol on the host machine as a detached daemon.
 */

const { spawn } = require('child_process');
const fs = require('fs');
const path = require('path');

async function openUrl(url) {
  const mod = await import('open');
  const openFn = mod.default || mod;
  if (typeof openFn !== 'function') {
    throw new TypeError('open module did not resolve to a function');
  }
  return openFn(url);
}

console.log('\x1b[31m%s\x1b[0m', 'Initializing CIPHER.SYS Command Node...');

// Resolve the path to the server.js file
const serverPath = path.join(__dirname, '..', 'server.js');
const distIndexPath = path.join(__dirname, '..', 'dist', 'index.html');
const LOCAL_URL = 'http://localhost:4040';
const MDNS_URL = 'http://cipher.local:4040';

if (!fs.existsSync(distIndexPath)) {
  console.log('\x1b[31m%s\x1b[0m', '[!] BUILD ARTIFACTS MISSING. dist/index.html was not found.');
  console.log('Run `npm run build` and relaunch, or reinstall the package.');
  console.log(`Then open ${LOCAL_URL} (or ${MDNS_URL} if mDNS is available).`);
  process.exit(1);
}

// SPAWN AS DETACHED DAEMON
// stdio: 'ignore' disconnects the server logs from this terminal
// detached: true makes it a background OS process
const server = spawn('node', [serverPath], { 
  detached: true, 
  stdio: 'ignore' 
});

// unref() allows this CLI script to exit while the server keeps running
server.unref();

console.log('\x1b[32m%s\x1b[0m', '[!] NODE DETACHED. RUNNING IN OS BACKGROUND.');
console.log('\x1b[33m%s\x1b[0m', '[!] You may safely close this terminal window.');
console.log('\x1b[33m%s\x1b[0m', '[!] The server will ONLY terminate when Scorched Earth is authorized.');

setTimeout(() => {
  console.log('\x1b[32m%s\x1b[0m', 'Opening interface...');
  
  // Prefer localhost for deterministic local startup; keep cipher.local as optional alias.
  openUrl(LOCAL_URL).catch(() => {
    console.log(`Please open ${LOCAL_URL} manually (or ${MDNS_URL} if mDNS is available).`);
  });
  
  setTimeout(() => {
    process.exit(0); // Exit the launcher, leave the server alive
  }, 1000);
}, 1500);
