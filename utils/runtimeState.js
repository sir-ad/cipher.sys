const fs = require('fs');
const os = require('os');
const path = require('path');

const RUNTIME_DIR = process.env.CIPHER_RUNTIME_DIR || path.join(os.tmpdir(), 'cipher-runtime');

const RUNTIME_PATHS = {
  dir: RUNTIME_DIR,
  daemonState: path.join(RUNTIME_DIR, 'daemon-state.json'),
  daemonPid: path.join(RUNTIME_DIR, 'daemon.pid'),
  daemonLog: path.join(RUNTIME_DIR, 'daemon.log'),
  mcpState: path.join(RUNTIME_DIR, 'mcp-state.json'),
  mcpPid: path.join(RUNTIME_DIR, 'mcp.pid'),
  mcpLog: path.join(RUNTIME_DIR, 'mcp.log'),
  discoveryState: path.join(RUNTIME_DIR, 'discovery-state.json'),
};

const CLEANUP_FILE_REGEX = [/\.lock$/i, /\.tmp$/i, /\.log$/i];
const CLEANUP_FILE_NAMES = new Set([
  path.basename(RUNTIME_PATHS.daemonState),
  path.basename(RUNTIME_PATHS.daemonPid),
  path.basename(RUNTIME_PATHS.daemonLog),
  path.basename(RUNTIME_PATHS.mcpState),
  path.basename(RUNTIME_PATHS.mcpPid),
  path.basename(RUNTIME_PATHS.mcpLog),
  path.basename(RUNTIME_PATHS.discoveryState),
]);

function ensureRuntimeDir() {
  if (!fs.existsSync(RUNTIME_DIR)) {
    fs.mkdirSync(RUNTIME_DIR, { recursive: true, mode: 0o755 });
  }
  return RUNTIME_DIR;
}

function safeReadJson(filePath) {
  try {
    if (!fs.existsSync(filePath)) return null;
    const raw = fs.readFileSync(filePath, 'utf8');
    return JSON.parse(raw);
  } catch (_) {
    return null;
  }
}

function safeWriteJson(filePath, payload) {
  ensureRuntimeDir();
  const tmpPath = `${filePath}.tmp`;
  fs.writeFileSync(tmpPath, JSON.stringify(payload, null, 2), { mode: 0o644 });
  fs.renameSync(tmpPath, filePath);
}

function safeUnlink(filePath) {
  try {
    fs.unlinkSync(filePath);
  } catch (_) {
    // no-op
  }
}

function isPidRunning(pid) {
  if (!Number.isInteger(pid) || pid <= 0) return false;
  try {
    process.kill(pid, 0);
    return true;
  } catch (_) {
    return false;
  }
}

function getDaemonState() {
  return safeReadJson(RUNTIME_PATHS.daemonState);
}

function setDaemonState(state) {
  safeWriteJson(RUNTIME_PATHS.daemonState, state);
  if (state && Number.isInteger(state.pid) && state.pid > 0) {
    ensureRuntimeDir();
    fs.writeFileSync(RUNTIME_PATHS.daemonPid, `${state.pid}\n`, { mode: 0o644 });
  }
}

function clearDaemonState() {
  safeUnlink(RUNTIME_PATHS.daemonState);
  safeUnlink(RUNTIME_PATHS.daemonPid);
}

function getMcpState() {
  return safeReadJson(RUNTIME_PATHS.mcpState);
}

function setMcpState(state) {
  safeWriteJson(RUNTIME_PATHS.mcpState, state);
  if (state && Number.isInteger(state.pid) && state.pid > 0) {
    ensureRuntimeDir();
    fs.writeFileSync(RUNTIME_PATHS.mcpPid, `${state.pid}\n`, { mode: 0o644 });
  }
}

function clearMcpState() {
  safeUnlink(RUNTIME_PATHS.mcpState);
  safeUnlink(RUNTIME_PATHS.mcpPid);
}

function cleanupRuntimeArtifacts() {
  ensureRuntimeDir();
  const removed = [];
  for (const entry of fs.readdirSync(RUNTIME_DIR)) {
    const entryPath = path.join(RUNTIME_DIR, entry);
    const shouldRemove =
      CLEANUP_FILE_NAMES.has(entry) || CLEANUP_FILE_REGEX.some((rx) => rx.test(entry));
    if (!shouldRemove) continue;
    try {
      fs.rmSync(entryPath, { recursive: true, force: true });
      removed.push(entryPath);
    } catch (_) {
      // no-op
    }
  }
  return removed;
}

module.exports = {
  RUNTIME_PATHS,
  ensureRuntimeDir,
  safeReadJson,
  safeWriteJson,
  safeUnlink,
  isPidRunning,
  getDaemonState,
  setDaemonState,
  clearDaemonState,
  getMcpState,
  setMcpState,
  clearMcpState,
  cleanupRuntimeArtifacts,
};
