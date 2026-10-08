import test from 'node:test';
import assert from 'node:assert/strict';
import { domainGroup, splitRecords } from './domain-split.js';
const row = (url, label = 'legitimate') => ({ url, label });
test('Groups subdomains under registrable multi-part domains', () => {
  assert.equal(domainGroup('https://a.example.co.uk/x'), 'domain:example.co.uk');
  assert.equal(domainGroup('https://b.example.co.uk/y'), 'domain:example.co.uk');
});
test('Keeps private suffix tenants separate', () => {
  assert.notEqual(domainGroup('https://alice.github.io'), domainGroup('https://bob.github.io'));
});
test('Canonicalizes IPs, IDNA and trailing dots', () => {
  assert.equal(domainGroup('https://[2001:db8::1]/'), 'ip:2001:db8::1');
  assert.equal(domainGroup('http://192.0.2.1/'), 'ip:192.0.2.1');
  assert.equal(domainGroup('https://bücher.de.'), domainGroup('https://xn--bcher-kva.de'));
});
test('Split is reproducible and input order independent', () => {
  const rows = Array.from({ length: 100 }, (_, i) => row(`https://site${i}.com`));
  assert.deepEqual(splitRecords(rows), splitRecords([...rows].reverse()));
  const result = splitRecords(rows);
  assert.ok(result.development.length && result.holdout.length);
});
test('Related URLs never cross partitions', () => {
  const result = splitRecords([row('https://a.example.com'), row('https://b.example.com')]);
  assert.ok(result.development.length === 2 || result.holdout.length === 2);
  assert.equal(result.summary.overlappingDomainGroups, 0);
});
test('Reconciles duplicates, conflicts, unknown labels and unsupported input', () => {
  const result = splitRecords([row('https://a.com'), row('https://a.com'), row('https://b.com'), row('https://b.com', 'phishing'), row('https://c.com', 'unknown'), row('chrome://settings'), row('bad'), null]);
  assert.equal(result.summary.excludedRecords, 7);
  assert.deepEqual(result.summary.exclusionReasons, { invalidRecord: 1, duplicate: 1, conflictingLabel: 2, unknownLabel: 1, invalidOrUnsupportedUrl: 2 });
});
test('Does not mutate input and accepts empty records', () => {
  const record = Object.freeze(row('https://example.com'));
  splitRecords(Object.freeze([record]));
  assert.equal(splitRecords([]).summary.inputRecords, 0);
});
test('Rejects invalid configuration', () => {
  assert.throws(() => splitRecords(null));
  for (const holdoutFraction of [0, 1, NaN, -1]) assert.throws(() => splitRecords([], { holdoutFraction }));
  assert.throws(() => splitRecords([], { seed: '' }));
});
