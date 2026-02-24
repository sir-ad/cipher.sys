const test = require('node:test');
const assert = require('node:assert/strict');

const { parseGlobalFlags, parseUpOptions } = require('../bin/cipher');

test('parseGlobalFlags strips --quiet and preserves command args', () => {
  const parsed = parseGlobalFlags(['--quiet', 'up', '--host']);
  assert.equal(parsed.quiet, true);
  assert.deepEqual(parsed.args, ['up', '--host']);
});

test('parseUpOptions parses --host mode', () => {
  const parsed = parseUpOptions(['--host']);
  assert.deepEqual(parsed, { forceHost: true, joinTarget: null });
});

test('parseUpOptions parses --join target', () => {
  const parsed = parseUpOptions(['--join', '192.168.1.8']);
  assert.deepEqual(parsed, { forceHost: false, joinTarget: '192.168.1.8' });
});

test('parseUpOptions rejects conflicting flags', () => {
  assert.throws(() => parseUpOptions(['--host', '--join', '10.0.0.2']), /Cannot use --host and --join/);
});

test('parseUpOptions rejects unknown flags', () => {
  assert.throws(() => parseUpOptions(['--bogus']), /Unsupported flag/);
});
