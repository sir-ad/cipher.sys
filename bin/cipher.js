#!/usr/bin/env node

/**
 * CIPHER.SYS LOCAL LAUNCHER // V4 PHOENIX PROTOCOL
 * Executes the ghost protocol on the host machine as a detached daemon.
 */

const { spawn } = require('child_process');
const path = require('path');

console.log('\x1b[31m%s\x1b[0m', 'Initializing CIPHER.SYS Command Node...');

// Resolve the path to the server.js file
const serverPath = path.join(__dirname, '..', 'server.js');

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
  
  // Directly force the opening of the custom mDNS signature domain for pure sci-fi aesthetics.
  import('open').then((openModule) => {
    const openFn = openModule.default || openModule;
    openFn('http://cipher.local:4040').catch(() => {
      console.log('Please open http://cipher.local:4040 manually.');
    });
  }).catch(() => {
    console.log('Please open http://cipher.local:4040 manually.');
  });
  
  setTimeout(() => {
    process.exit(0); // Exit the launcher, leave the server alive
  }, 1000);
}, 1500);
