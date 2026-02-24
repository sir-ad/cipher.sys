#!/usr/bin/env node

const { spawn, spawnSync } = require('child_process');
const fs = require('fs');
const http = require('http');
const net = require('net');
const path = require('path');
const {
  RUNTIME_PATHS,
  ensureRuntimeDir,
  getDaemonState,
  setDaemonState,
  clearDaemonState,
  getMcpState,
  clearMcpState,
  cleanupRuntimeArtifacts,
  isPidRunning,
} = require('../utils/runtimeState');

const PROJECT_ROOT = path.join(__dirname, '..');
const SERVER_PATH = path.join(PROJECT_ROOT, 'server.js');
const MCP_SERVER_PATH = path.join(PROJECT_ROOT, 'mcp', 'server.js');
const DIST_INDEX_PATH = path.join(PROJECT_ROOT, 'dist', 'index.html');

const PORT = 4040;
const MCP_PORT = 4041;
const LOCAL_URL = `http://localhost:${PORT}`;
const MDNS_URL = `http://cipher.local:${PORT}`;
const HEALTH_URL = `${LOCAL_URL}/healthz`;

function sleep(ms) {
  return new Promise((resolve) => setTimeout(resolve, ms));
}

function requestJson(method, rawUrl, payload, timeoutMs = 2500) {
  return new Promise((resolve, reject) => {
    const url = new URL(rawUrl);
    const body = payload ? JSON.stringify(payload) : null;
    const req = http.request(
      {
        hostname: url.hostname,
        port: url.port ? Number(url.port) : 80,
        path: `${url.pathname}${url.search}`,
        method,
        headers: {
          Accept: 'application/json',
          ...(body
            ? {
                'Content-Type': 'application/json',
                'Content-Length': Buffer.byteLength(body),
              }
            : {}),
        },
      },
      (res) => {
        let raw = '';
        res.on('data', (chunk) => {
          raw += chunk;
        });
        res.on('end', () => {
          let parsed = null;
          if (raw) {
            try {
              parsed = JSON.parse(raw);
            } catch (_) {
              parsed = { raw };
            }
          }
          resolve({ statusCode: res.statusCode || 0, headers: res.headers, data: parsed });
        });
      }
    );
    req.on('error', reject);
    req.setTimeout(timeoutMs, () => req.destroy(new Error(`Request timeout: ${rawUrl}`)));
    if (body) req.write(body);
    req.end();
  });
}

function checkPortOpen(port) {
  return new Promise((resolve) => {
    const socket = net.createConnection({ host: '127.0.0.1', port }, () => {
      socket.destroy();
      resolve(true);
    });
    socket.on('error', () => resolve(false));
    socket.setTimeout(500, () => {
      socket.destroy();
      resolve(false);
    });
  });
}

function getPidFromPort(port) {
  if (process.platform === 'win32') {
    const result = spawnSync('netstat', ['-ano', '-p', 'tcp'], { encoding: 'utf8' });
    if (result.status !== 0 || !result.stdout) return null;
    const lines = result.stdout.split(/\r?\n/);
    for (const line of lines) {
      if (!line.includes(`:${port}`) || !line.toUpperCase().includes('LISTEN')) continue;
      const parts = line.trim().split(/\s+/);
      const pid = Number(parts[parts.length - 1]);
      if (Number.isInteger(pid) && pid > 0) return pid;
    }
    return null;
  }

  const result = spawnSync('lsof', ['-ti', `tcp:${port}`, '-sTCP:LISTEN'], { encoding: 'utf8' });
  if (result.status !== 0 || !result.stdout) return null;
  const first = result.stdout.trim().split(/\r?\n/)[0];
  const pid = Number(first);
  return Number.isInteger(pid) && pid > 0 ? pid : null;
}

function getProcessCommand(pid) {
  if (!Number.isInteger(pid) || pid <= 0) return '';
  if (process.platform === 'win32') return '';
  const result = spawnSync('ps', ['-p', String(pid), '-o', 'command='], { encoding: 'utf8' });
  return result.status === 0 ? String(result.stdout || '').trim() : '';
}

function looksLikeCipherProcess(command) {
  if (!command) return false;
  return /cipher|@cipher\.sys|server\.js/i.test(command);
}

async function daemonHealth() {
  try {
    const res = await requestJson('GET', HEALTH_URL, null, 1200);
    const ok =
      res.statusCode === 200 &&
      String(res.headers['x-cipher'] || '') === '1' &&
      Boolean(res.data && res.data.ok);
    return { ok, response: res };
  } catch (_) {
    return { ok: false, response: null };
  }
}

async function mcpHealth(port = MCP_PORT) {
  try {
    const res = await requestJson('GET', `http://127.0.0.1:${port}/healthz`, null, 1200);
    return res.statusCode === 200 && Boolean(res.data && res.data.ok);
  } catch (_) {
    return false;
  }
}

async function openUrl(url) {
  const mod = await import('open');
  const openFn = mod.default || mod;
  if (typeof openFn !== 'function') {
    throw new TypeError('open module did not resolve to a function');
  }
  return openFn(url);
}

function buildMissingArtifactsError() {
  return [
    '[!] BUILD ARTIFACTS MISSING: dist/index.html not found.',
    'Run `npm run build` and relaunch, or reinstall the package.',
    `Then open ${LOCAL_URL} (or ${MDNS_URL} if mDNS is available).`,
  ].join('\n');
}

async function waitForPidExit(pid, timeoutMs) {
  const started = Date.now();
  while (Date.now() - started < timeoutMs) {
    if (!isPidRunning(pid)) return true;
    await sleep(120);
  }
  return !isPidRunning(pid);
}

function forceKillPid(pid) {
  if (!Number.isInteger(pid) || pid <= 0) return false;
  try {
    process.kill(pid, 'SIGKILL');
    return true;
  } catch (_) {
    if (process.platform === 'win32') {
      const result = spawnSync('taskkill', ['/PID', String(pid), '/T', '/F'], { stdio: 'ignore' });
      return result.status === 0;
    }
    return false;
  }
}

async function stopDaemon({ reason = 'CLI_STOP', clean = true } = {}) {
  const state = getDaemonState();
  const result = { hadProcess: false, stopped: false, forced: false };

  const health = await daemonHealth();
  if (health.ok) {
    result.hadProcess = true;
    try {
      await requestJson('POST', `${LOCAL_URL}/api/shutdown`, { reason }, 1500);
      result.stopped = true;
    } catch (_) {
      // fall through to PID-based stop
    }
  }

  if (state && Number.isInteger(state.pid) && isPidRunning(state.pid)) {
    result.hadProcess = true;
    if (!result.stopped) {
      try {
        process.kill(state.pid, 'SIGTERM');
      } catch (_) {
        // no-op
      }
    }
    const exited = await waitForPidExit(state.pid, 2500);
    if (!exited) {
      result.forced = forceKillPid(state.pid);
      await waitForPidExit(state.pid, 1200);
    }
  }

  if (!result.hadProcess && (await checkPortOpen(PORT))) {
    const portPid = getPidFromPort(PORT);
    if (portPid && isPidRunning(portPid)) {
      const command = getProcessCommand(portPid);
      if (!command || looksLikeCipherProcess(command)) {
        result.hadProcess = true;
        try {
          process.kill(portPid, 'SIGTERM');
        } catch (_) {
          // no-op
        }
        const exited = await waitForPidExit(portPid, 2200);
        if (!exited) {
          result.forced = forceKillPid(portPid);
          await waitForPidExit(portPid, 1200);
        }
      }
    }
  }

  clearDaemonState();
  if (clean) {
    cleanupRuntimeArtifacts();
  }
  return result;
}

async function stopMcp() {
  const state = getMcpState();
  if (!state || !Number.isInteger(state.pid) || !isPidRunning(state.pid)) {
    clearMcpState();
    return false;
  }
  try {
    process.kill(state.pid, 'SIGTERM');
  } catch (_) {
    // no-op
  }
  const exited = await waitForPidExit(state.pid, 1600);
  if (!exited) forceKillPid(state.pid);
  clearMcpState();
  return true;
}

function spawnDaemonDetached() {
  ensureRuntimeDir();
  const logFd = fs.openSync(RUNTIME_PATHS.daemonLog, 'a');
  const child = spawn(process.execPath, [SERVER_PATH], {
    cwd: PROJECT_ROOT,
    detached: true,
    stdio: ['ignore', logFd, logFd],
    env: { ...process.env, PORT: String(PORT) },
  });
  child.unref();
  setDaemonState({
    pid: child.pid,
    port: PORT,
    domain: 'cipher.local',
    startedAt: Date.now(),
    launcher: process.pid,
  });
  return child;
}

async function waitForDaemonHealthy(timeoutMs = 12000) {
  const started = Date.now();
  while (Date.now() - started < timeoutMs) {
    const health = await daemonHealth();
    if (health.ok) return true;
    await sleep(180);
  }
  return false;
}

async function openApp() {
  try {
    await openUrl(LOCAL_URL);
    return true;
  } catch (_) {
    console.log(`Open ${LOCAL_URL} manually (fallback alias: ${MDNS_URL}).`);
    return false;
  }
}

async function commandUp() {
  if (!fs.existsSync(DIST_INDEX_PATH)) {
    console.error(buildMissingArtifactsError());
    process.exit(1);
  }

  console.log('[CIPHER] up: stopping previous runtime...');
  await stopMcp();
  await stopDaemon({ reason: 'CIPHER_UP_RESTART', clean: true });

  console.log('[CIPHER] up: starting fresh daemon...');
  spawnDaemonDetached();
  const healthy = await waitForDaemonHealthy();
  if (!healthy) {
    const isPortOpen = await checkPortOpen(PORT);
    console.error('[CIPHER] daemon did not become healthy in time.');
    if (isPortOpen) {
      console.error(`[CIPHER] Port ${PORT} is in use by another process.`);
    }
    process.exit(1);
  }

  console.log(`[CIPHER] daemon ready at ${LOCAL_URL}`);
  await openApp();
}

async function commandStop() {
  console.log('[CIPHER] stop: terminating daemon and MCP runtime...');
  const mcpStopped = await stopMcp();
  const daemon = await stopDaemon({ reason: 'CLI_STOP', clean: true });
  if (!daemon.hadProcess && !mcpStopped) {
    console.log('[CIPHER] no active runtime found.');
    return;
  }
  console.log('[CIPHER] runtime terminated.');
}

async function commandStatus() {
  const state = getDaemonState();
  const mcpState = getMcpState();
  const health = await daemonHealth();
  const mcpRunning = await mcpHealth(mcpState?.port || MCP_PORT);

  if (health.ok) {
    console.log(`[CIPHER] daemon: UP @ ${LOCAL_URL}`);
    console.log(`[CIPHER] pid: ${health.response?.data?.pid || state?.pid || 'unknown'}`);
    console.log(`[CIPHER] mode: ${health.response?.data?.mode || 'UNKNOWN'}`);
  } else {
    console.log('[CIPHER] daemon: DOWN');
  }

  if (mcpRunning) {
    console.log(`[CIPHER] mcp: UP @ http://127.0.0.1:${mcpState?.port || MCP_PORT}`);
    console.log(`[CIPHER] mcp pid: ${mcpState?.pid || 'unknown'}`);
  } else {
    console.log('[CIPHER] mcp: DOWN');
  }

  console.log(`[CIPHER] runtime dir: ${RUNTIME_PATHS.dir}`);
  if (!health.ok) process.exitCode = 1;
}

async function commandOpen() {
  const healthy = await daemonHealth();
  if (!healthy.ok) {
    console.log('[CIPHER] daemon not healthy; running `cipher up` first...');
    await commandUp();
    return;
  }
  await openApp();
}

function parsePortFlag(args, defaultPort) {
  const i = args.findIndex((arg) => arg === '--port' || arg === '-p');
  if (i === -1) return defaultPort;
  const value = Number(args[i + 1]);
  if (!Number.isInteger(value) || value < 1 || value > 65535) {
    throw new Error('Invalid port: expected integer between 1 and 65535');
  }
  return value;
}

async function commandMcp(args) {
  const sub = args[0] || 'start';
  if (sub !== 'start') {
    throw new Error(`Unsupported mcp command: ${sub}`);
  }

  const foreground = args.includes('--foreground');
  const port = parsePortFlag(args, MCP_PORT);
  const daemonUrl =
    process.env.CIPHER_DAEMON_URL || `${LOCAL_URL}`;

  await stopMcp();

  if (foreground) {
    const child = spawn(process.execPath, [MCP_SERVER_PATH], {
      cwd: PROJECT_ROOT,
      stdio: 'inherit',
      env: {
        ...process.env,
        CIPHER_MCP_PORT: String(port),
        CIPHER_DAEMON_URL: daemonUrl,
      },
    });
    child.on('exit', (code) => process.exit(code || 0));
    return;
  }

  ensureRuntimeDir();
  const logFd = fs.openSync(RUNTIME_PATHS.mcpLog, 'a');
  const child = spawn(process.execPath, [MCP_SERVER_PATH], {
    cwd: PROJECT_ROOT,
    detached: true,
    stdio: ['ignore', logFd, logFd],
    env: {
      ...process.env,
      CIPHER_MCP_PORT: String(port),
      CIPHER_DAEMON_URL: daemonUrl,
    },
  });
  child.unref();

  for (let i = 0; i < 20; i++) {
    const ok = await mcpHealth(port);
    if (ok) {
      console.log(`[CIPHER] MCP ready @ http://127.0.0.1:${port}`);
      return;
    }
    await sleep(150);
  }
  console.error('[CIPHER] MCP did not become healthy in time.');
  process.exit(1);
}

function printHelp() {
  console.log(`
CIPHER.SYS CLI

Usage:
  cipher up                 Stop old instance, clean runtime, start fresh daemon, open app
  cipher stop               Stop daemon and clean runtime artifacts
  cipher status             Show daemon/MCP status
  cipher open               Open browser app (starts daemon if needed)
  cipher mcp start          Start MCP server in background
  cipher mcp start --foreground
`);
}

async function main() {
  const args = process.argv.slice(2);
  const command = args[0] || 'up';

  try {
    if (command === 'up' || command === 'start') {
      await commandUp();
      return;
    }
    if (command === 'stop') {
      await commandStop();
      return;
    }
    if (command === 'status') {
      await commandStatus();
      return;
    }
    if (command === 'open') {
      await commandOpen();
      return;
    }
    if (command === 'mcp') {
      await commandMcp(args.slice(1));
      return;
    }
    if (command === 'help' || command === '--help' || command === '-h') {
      printHelp();
      return;
    }

    console.error(`[CIPHER] unknown command: ${command}`);
    printHelp();
    process.exit(1);
  } catch (err) {
    console.error(`[CIPHER] ${err.message}`);
    process.exit(1);
  }
}

main();
