import test from 'node:test';
import assert from 'node:assert/strict';
import { createHash } from 'node:crypto';
import { evaluateDevelopment } from './development-evaluation.js';

function fixture(partition = 'development') {
  const raw = Buffer.from(JSON.stringify({ kind: 'dataset', partition, records: [
    { url: 'http://192.0.2.1/', label: 'phishing' },
    { url: 'https://example.com/', label: 'legitimate' }
  ] }));
  return [raw, { outputSha256: { 'development.json': createHash('sha256').update(raw).digest('hex') }, summary: { development: { records: 2 } } }];
}
test('Development runner uses shared engine and threshold 30', () => {
  const result = evaluateDevelopment(...fixture());
  assert.equal(result.threshold, 30);
  assert.deepEqual(result.metrics.counts, { tp: 1, fp: 0, fn: 0, tn: 1 });
});
test('Rejects holdout even with a matching checksum', () => {
  assert.throws(() => evaluateDevelopment(...fixture('holdout')), /Only the development/);
});
test('Rejects changed input bytes or missing checksum', () => {
  const [raw, manifest] = fixture();
  assert.throws(() => evaluateDevelopment(Buffer.concat([raw, Buffer.from(' ')]), manifest), /checksum/);
  assert.throws(() => evaluateDevelopment(raw, {}), /checksum/);
});
test('Rejects mismatched record count', () => {
  const [raw, manifest] = fixture();
  manifest.summary.development.records = 3;
  assert.throws(() => evaluateDevelopment(raw, manifest), /record count/);
});
