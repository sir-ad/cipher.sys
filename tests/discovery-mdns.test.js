const test = require('node:test');
const assert = require('node:assert/strict');

const {
  normalizeJoinTarget,
  buildCandidateUrls,
  queryMdnsARecords,
} = require('../utils/discoveryClient');

test('normalizeJoinTarget normalizes plain host to http+default port', () => {
  assert.equal(normalizeJoinTarget('192.168.1.10'), 'http://192.168.1.10:4040');
});

test('normalizeJoinTarget keeps explicit scheme and port', () => {
  assert.equal(normalizeJoinTarget('https://cipher.local:4443/path'), 'https://cipher.local:4443');
});

test('normalizeJoinTarget rejects invalid targets', () => {
  assert.equal(normalizeJoinTarget('http://:bad-port'), null);
  assert.equal(normalizeJoinTarget(''), null);
});

test('buildCandidateUrls de-duplicates domain and ip candidates', () => {
  const urls = buildCandidateUrls({ domain: 'cipher.local', ips: ['192.168.1.5', '192.168.1.5'] });
  assert.ok(urls.includes('http://cipher.local:4040'));
  assert.ok(urls.includes('http://192.168.1.5:4040'));
  assert.equal(urls.length, 2);
});

test('queryMdnsARecords never throws and returns shaped payload', async () => {
  const result = await queryMdnsARecords('cipher.local', 20);
  assert.equal(Array.isArray(result.ips), true);
  assert.equal(Object.prototype.hasOwnProperty.call(result, 'error'), true);
});
