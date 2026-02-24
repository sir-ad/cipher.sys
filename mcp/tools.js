const http = require('http');
const https = require('https');

function requestJson(method, rawUrl, payload) {
  return new Promise((resolve, reject) => {
    const url = new URL(rawUrl);
    const isHttps = url.protocol === 'https:';
    const transport = isHttps ? https : http;
    const body = payload ? JSON.stringify(payload) : null;
    const headers = { Accept: 'application/json' };
    if (body) headers['Content-Type'] = 'application/json';
    if (body) headers['Content-Length'] = Buffer.byteLength(body);

    const req = transport.request(
      {
        protocol: url.protocol,
        hostname: url.hostname,
        port: url.port ? Number(url.port) : isHttps ? 443 : 80,
        path: `${url.pathname}${url.search}`,
        method,
        headers,
      },
      (res) => {
        let raw = '';
        res.on('data', (chunk) => {
          raw += chunk;
        });
        res.on('end', () => {
          if (res.statusCode && res.statusCode >= 400) {
            reject(new Error(`HTTP ${res.statusCode}: ${raw || 'request failed'}`));
            return;
          }
          if (!raw) {
            resolve({});
            return;
          }
          try {
            resolve(JSON.parse(raw));
          } catch (err) {
            reject(new Error(`Invalid JSON from ${rawUrl}: ${err.message}`));
          }
        });
      }
    );

    req.on('error', reject);
    req.setTimeout(8000, () => req.destroy(new Error(`Request timeout: ${rawUrl}`)));
    if (body) req.write(body);
    req.end();
  });
}

function withBase(baseUrl, path) {
  const root = baseUrl.replace(/\/+$/, '');
  return `${root}${path}`;
}

const TOOL_DESCRIPTORS = [
  { name: 'cipher.health', description: 'Read daemon health state.' },
  { name: 'cipher.discovery', description: 'Read daemon discovery and runtime metadata.' },
  { name: 'cipher.state', description: 'Read full synchronized task state.' },
  { name: 'cipher.list_tasks', description: 'List all tasks from the daemon.' },
  { name: 'cipher.add_task', description: 'Create a task in the daemon.', input: { text: 'string' } },
  { name: 'cipher.complete_task', description: 'Mark a task as completed.', input: { id: 'string' } },
  { name: 'cipher.delete_task', description: 'Mark a task as deleted.', input: { id: 'string' } },
  { name: 'ollama.tags', description: 'List models from an Ollama endpoint.' },
  {
    name: 'ollama.generate',
    description: 'Generate text from an Ollama endpoint.',
    input: { model: 'string', prompt: 'string' },
  },
];

function createToolHandlers(config = {}) {
  const daemonBaseUrl = config.daemonBaseUrl || 'http://127.0.0.1:4040';
  const defaultOllamaUrl = config.ollamaBaseUrl || 'http://127.0.0.1:11434';

  return {
    listTools: async () => ({ tools: TOOL_DESCRIPTORS }),
    callTool: async (toolName, input = {}) => {
      switch (toolName) {
        case 'cipher.health':
          return requestJson('GET', withBase(daemonBaseUrl, '/healthz'));
        case 'cipher.discovery':
          return requestJson('GET', withBase(daemonBaseUrl, '/api/discovery'));
        case 'cipher.state':
          return requestJson('GET', withBase(daemonBaseUrl, '/api/state'));
        case 'cipher.list_tasks':
          return requestJson('GET', withBase(daemonBaseUrl, '/api/tasks'));
        case 'cipher.add_task':
          return requestJson('POST', withBase(daemonBaseUrl, '/api/tasks'), {
            text: input.text,
            owner: input.owner,
            handler: input.handler,
            syndicate: input.syndicate,
          });
        case 'cipher.complete_task':
          if (!input.id) throw new Error('cipher.complete_task requires input.id');
          return requestJson('POST', withBase(daemonBaseUrl, `/api/tasks/${encodeURIComponent(input.id)}/complete`), {});
        case 'cipher.delete_task':
          if (!input.id) throw new Error('cipher.delete_task requires input.id');
          return requestJson('POST', withBase(daemonBaseUrl, `/api/tasks/${encodeURIComponent(input.id)}/delete`), {});
        case 'ollama.tags': {
          const base = input.baseUrl || defaultOllamaUrl;
          return requestJson('GET', withBase(base, '/api/tags'));
        }
        case 'ollama.generate': {
          const base = input.baseUrl || defaultOllamaUrl;
          return requestJson('POST', withBase(base, '/api/generate'), {
            model: input.model,
            prompt: input.prompt,
            stream: false,
          });
        }
        default:
          throw new Error(`Unknown tool: ${toolName}`);
      }
    },
  };
}

module.exports = {
  TOOL_DESCRIPTORS,
  createToolHandlers,
};
