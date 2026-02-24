#!/usr/bin/env node

const { io } = require('socket.io-client');

const DAEMON_URL = process.env.CIPHER_DAEMON_URL || 'http://127.0.0.1:4040';
const TASK_TEXT = `SMOKE_SYNC_${Date.now()}`;

async function fetchJson(path, options = {}) {
  const response = await fetch(`${DAEMON_URL}${path}`, {
    headers: { 'content-type': 'application/json' },
    ...options,
  });
  const data = await response.json().catch(() => ({}));
  return { response, data };
}

function connectClient(label) {
  return new Promise((resolve, reject) => {
    const socket = io(DAEMON_URL, { timeout: 5000, reconnection: false });
    const timer = setTimeout(() => {
      socket.close();
      reject(new Error(`${label} failed to connect in time`));
    }, 7000);

    socket.on('connect', () => {
      clearTimeout(timer);
      resolve(socket);
    });

    socket.on('connect_error', (err) => {
      clearTimeout(timer);
      socket.close();
      reject(new Error(`${label} connect_error: ${err.message}`));
    });
  });
}

async function main() {
  const health = await fetchJson('/healthz');
  if (!health.response.ok || health.response.headers.get('x-cipher') !== '1') {
    throw new Error(`Daemon not healthy at ${DAEMON_URL}`);
  }

  const [clientA, clientB] = await Promise.all([connectClient('clientA'), connectClient('clientB')]);

  let seenTaskId = null;
  const waitForSync = new Promise((resolve, reject) => {
    const timer = setTimeout(() => reject(new Error('clientB did not receive synced task')), 7000);
    clientB.on('sync_state', (state) => {
      const tasks = Array.isArray(state?.tasks) ? state.tasks : [];
      const found = tasks.find((task) => task && task.text === TASK_TEXT);
      if (found) {
        clearTimeout(timer);
        seenTaskId = found.id;
        resolve();
      }
    });
  });

  const created = await fetchJson('/api/tasks', {
    method: 'POST',
    body: JSON.stringify({ text: TASK_TEXT }),
  });
  if (!created.response.ok) {
    throw new Error(`Failed to create smoke task: ${created.response.status}`);
  }

  await waitForSync;

  if (seenTaskId) {
    await fetchJson(`/api/tasks/${encodeURIComponent(seenTaskId)}/delete`, {
      method: 'POST',
      body: JSON.stringify({}),
    }).catch(() => {});
  }

  clientA.close();
  clientB.close();
  console.log(`[SMOKE] multi-device sync OK via ${DAEMON_URL}`);
}

main().catch((err) => {
  console.error(`[SMOKE] ${err.message}`);
  process.exit(1);
});
