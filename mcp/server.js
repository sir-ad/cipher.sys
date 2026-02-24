#!/usr/bin/env node

const http = require('http');
const { createToolHandlers } = require('./tools');
const {
  setMcpState,
  clearMcpState,
  ensureRuntimeDir,
  RUNTIME_PATHS,
} = require('../utils/runtimeState');

const MCP_PORT = Number(process.env.CIPHER_MCP_PORT || 4041);
const DAEMON_BASE_URL = process.env.CIPHER_DAEMON_URL || 'http://127.0.0.1:4040';
const OLLAMA_BASE_URL = process.env.CIPHER_OLLAMA_URL || 'http://127.0.0.1:11434';

const tools = createToolHandlers({
  daemonBaseUrl: DAEMON_BASE_URL,
  ollamaBaseUrl: OLLAMA_BASE_URL,
});

function sendJson(res, statusCode, payload) {
  res.writeHead(statusCode, { 'Content-Type': 'application/json; charset=utf-8' });
  res.end(JSON.stringify(payload));
}

function parseBody(req) {
  return new Promise((resolve, reject) => {
    let raw = '';
    req.on('data', (chunk) => {
      raw += chunk;
      if (raw.length > 1_000_000) {
        reject(new Error('Request body too large'));
        req.destroy();
      }
    });
    req.on('end', () => {
      if (!raw) {
        resolve({});
        return;
      }
      try {
        resolve(JSON.parse(raw));
      } catch (err) {
        reject(new Error(`Invalid JSON payload: ${err.message}`));
      }
    });
    req.on('error', reject);
  });
}

async function handleJsonRpc(body) {
  const id = Object.prototype.hasOwnProperty.call(body, 'id') ? body.id : null;
  const method = body?.method;
  const params = body?.params || {};

  if (method === 'tools/list') {
    const result = await tools.listTools();
    return { jsonrpc: '2.0', id, result };
  }

  if (method === 'tools/call') {
    const name = params.name || params.tool || params.toolName;
    const input = params.arguments || params.input || {};
    if (!name) {
      return {
        jsonrpc: '2.0',
        id,
        error: { code: -32602, message: 'Missing tool name in params.name' },
      };
    }
    const result = await tools.callTool(name, input);
    return { jsonrpc: '2.0', id, result };
  }

  return {
    jsonrpc: '2.0',
    id,
    error: { code: -32601, message: `Method not found: ${method}` },
  };
}

const server = http.createServer(async (req, res) => {
  try {
    if (req.method === 'GET' && req.url === '/healthz') {
      sendJson(res, 200, {
        ok: true,
        pid: process.pid,
        port: MCP_PORT,
        daemonBaseUrl: DAEMON_BASE_URL,
        runtimeDir: RUNTIME_PATHS.dir,
      });
      return;
    }

    if (req.method === 'GET' && req.url === '/tools') {
      const payload = await tools.listTools();
      sendJson(res, 200, payload);
      return;
    }

    if (req.method === 'POST' && req.url === '/call') {
      const body = await parseBody(req);
      const name = body.tool || body.name;
      if (!name) {
        sendJson(res, 400, { error: 'Missing tool name in body.tool' });
        return;
      }
      const result = await tools.callTool(name, body.input || {});
      sendJson(res, 200, { ok: true, tool: name, result });
      return;
    }

    if (req.method === 'POST' && req.url === '/mcp') {
      const body = await parseBody(req);
      const payload = await handleJsonRpc(body);
      sendJson(res, payload.error ? 400 : 200, payload);
      return;
    }

    sendJson(res, 404, { error: 'Not found' });
  } catch (err) {
    sendJson(res, 500, { error: err.message });
  }
});

function shutdownMcp(reason = 'MCP_SHUTDOWN') {
  clearMcpState();
  server.close(() => process.exit(0));
  setTimeout(() => process.exit(0), 1000).unref();
  process.stderr.write(`[MCP] stopping (${reason})\n`);
}

process.on('SIGINT', () => shutdownMcp('SIGINT'));
process.on('SIGTERM', () => shutdownMcp('SIGTERM'));
process.on('exit', () => clearMcpState());

ensureRuntimeDir();
server.listen(MCP_PORT, '127.0.0.1', () => {
  setMcpState({
    pid: process.pid,
    port: MCP_PORT,
    daemonBaseUrl: DAEMON_BASE_URL,
    startedAt: Date.now(),
  });
  process.stdout.write(`[MCP] listening on http://127.0.0.1:${MCP_PORT}\n`);
});
