const dns = require('dns').promises;
const http = require('http');
const https = require('https');
const os = require('os');

const DEFAULT_PORT = 4040;

function sleep(ms) {
  return new Promise((resolve) => setTimeout(resolve, ms));
}

function getLocalIpv4s() {
  const localIps = new Set(['127.0.0.1']);
  const interfaces = os.networkInterfaces();
  Object.values(interfaces)
    .flat()
    .forEach((iface) => {
      if (iface && iface.family === 'IPv4' && iface.address) {
        localIps.add(iface.address);
      }
    });
  return Array.from(localIps);
}

function normalizeJoinTarget(rawTarget, defaultPort = DEFAULT_PORT) {
  if (!rawTarget || typeof rawTarget !== 'string') return null;
  let value = rawTarget.trim();
  if (!value) return null;

  if (!/^[a-zA-Z][a-zA-Z\d+.-]*:/.test(value)) {
    value = `http://${value}`;
  }

  let url;
  try {
    url = new URL(value);
  } catch (_) {
    return null;
  }

  if (url.protocol !== 'http:' && url.protocol !== 'https:') return null;

  const port = url.port ? Number(url.port) : defaultPort;
  if (!Number.isInteger(port) || port < 1 || port > 65535) return null;

  return `${url.protocol}//${url.hostname}:${port}`;
}

function requestJson(method, rawUrl, payload, timeoutMs = 1500) {
  return new Promise((resolve, reject) => {
    const url = new URL(rawUrl);
    const transport = url.protocol === 'https:' ? https : http;
    const body = payload ? JSON.stringify(payload) : null;

    const req = transport.request(
      {
        protocol: url.protocol,
        hostname: url.hostname,
        port: url.port ? Number(url.port) : url.protocol === 'https:' ? 443 : 80,
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
          let data = null;
          if (raw) {
            try {
              data = JSON.parse(raw);
            } catch (_) {
              data = { raw };
            }
          }
          resolve({ statusCode: res.statusCode || 0, headers: res.headers, data });
        });
      }
    );

    req.on('error', reject);
    req.setTimeout(timeoutMs, () => req.destroy(new Error(`Request timeout: ${rawUrl}`)));
    if (body) req.write(body);
    req.end();
  });
}

async function probeHost(rawTarget, options = {}) {
  const timeoutMs = options.timeoutMs || 1500;
  const defaultPort = options.port || DEFAULT_PORT;
  const baseUrl = normalizeJoinTarget(rawTarget, defaultPort);
  if (!baseUrl) {
    return { ok: false, baseUrl: null, error: 'Invalid target URL' };
  }

  try {
    const health = await requestJson('GET', `${baseUrl}/healthz`, null, timeoutMs);
    const ok =
      health.statusCode === 200 &&
      String(health.headers['x-cipher'] || '') === '1' &&
      Boolean(health.data && health.data.ok);

    if (!ok) {
      return { ok: false, baseUrl, error: 'Target is not a healthy CIPHER host' };
    }

    let discovery = null;
    try {
      const discoveryRes = await requestJson('GET', `${baseUrl}/api/discovery`, null, timeoutMs);
      if (discoveryRes.statusCode === 200) discovery = discoveryRes.data;
    } catch (_) {
      discovery = null;
    }

    return {
      ok: true,
      baseUrl,
      health: health.data,
      discovery,
    };
  } catch (err) {
    return {
      ok: false,
      baseUrl,
      error: err instanceof Error ? err.message : String(err),
    };
  }
}

async function lookupDnsARecords(domain, timeoutMs = 1000) {
  try {
    const timeoutPromise = sleep(timeoutMs).then(() => []);
    const records = await Promise.race([dns.resolve4(domain), timeoutPromise]);
    return Array.isArray(records) ? records : [];
  } catch (_) {
    return [];
  }
}

function extractARecords(packet, domain) {
  const target = String(domain || '').toLowerCase().replace(/\.$/, '');
  const ips = [];
  const entries = [
    ...(Array.isArray(packet.answers) ? packet.answers : []),
    ...(Array.isArray(packet.additionals) ? packet.additionals : []),
  ];

  entries.forEach((entry) => {
    const name = String(entry && entry.name ? entry.name : '')
      .toLowerCase()
      .replace(/\.$/, '');
    if (name !== target) return;
    if (String(entry.type).toUpperCase() !== 'A') return;
    if (typeof entry.data === 'string') ips.push(entry.data);
  });

  return ips;
}

async function queryMdnsARecords(domain, timeoutMs = 1000) {
  let mdnsFactory;
  try {
    mdnsFactory = require('multicast-dns');
  } catch (_) {
    return { ips: [], error: 'multicast-dns module unavailable' };
  }

  return new Promise((resolve) => {
    const ips = new Set();
    let finished = false;
    let client;

    const finish = (error = null) => {
      if (finished) return;
      finished = true;
      if (client && typeof client.destroy === 'function') {
        try {
          client.destroy();
        } catch (_) {
          // no-op
        }
      }
      resolve({ ips: Array.from(ips), error });
    };

    try {
      client = mdnsFactory();
    } catch (err) {
      finish(err instanceof Error ? err.message : String(err));
      return;
    }

    const timer = setTimeout(() => finish(null), timeoutMs);

    client.on('response', (packet) => {
      extractARecords(packet, domain).forEach((ip) => ips.add(ip));
    });

    client.on('error', (err) => {
      clearTimeout(timer);
      finish(err instanceof Error ? err.message : String(err));
    });

    try {
      client.query({ questions: [{ name: domain, type: 'A' }] });
    } catch (err) {
      clearTimeout(timer);
      finish(err instanceof Error ? err.message : String(err));
      return;
    }

    timer.unref?.();
  });
}

function buildCandidateUrls(options = {}) {
  const domain = options.domain || 'cipher.local';
  const port = options.port || DEFAULT_PORT;
  const ips = Array.isArray(options.ips) ? options.ips : [];

  const out = new Set();
  const domainUrl = normalizeJoinTarget(`http://${domain}:${port}`, port);
  if (domainUrl) out.add(domainUrl);

  ips.forEach((ip) => {
    const candidate = normalizeJoinTarget(ip, port);
    if (candidate) out.add(candidate);
  });

  return Array.from(out);
}

async function findLanHost(options = {}) {
  const domain = options.domain || 'cipher.local';
  const port = options.port || DEFAULT_PORT;
  const timeoutMs = options.timeoutMs || 1500;
  const excluded = new Set(options.excludeIps || []);

  const [mdnsResult, dnsIps] = await Promise.all([
    queryMdnsARecords(domain, Math.min(timeoutMs, 1200)),
    lookupDnsARecords(domain, Math.min(timeoutMs, 1200)),
  ]);

  const candidates = buildCandidateUrls({
    domain,
    port,
    ips: [...mdnsResult.ips, ...dnsIps],
  });

  for (const candidate of candidates) {
    const hostname = new URL(candidate).hostname;
    if (excluded.has(hostname) || hostname === 'localhost' || hostname === '127.0.0.1') {
      continue;
    }

    const probe = await probeHost(candidate, { timeoutMs, port });
    if (!probe.ok) continue;

    const remoteIp = probe.discovery && probe.discovery.networkIp;
    if (remoteIp && excluded.has(remoteIp)) {
      continue;
    }

    return {
      ...probe,
      source: probe.baseUrl.includes(domain) ? 'mdns' : 'ip',
      mdnsError: mdnsResult.error || null,
    };
  }

  return null;
}

module.exports = {
  DEFAULT_PORT,
  getLocalIpv4s,
  normalizeJoinTarget,
  buildCandidateUrls,
  probeHost,
  lookupDnsARecords,
  queryMdnsARecords,
  findLanHost,
};
