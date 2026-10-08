import test from 'node:test';
import assert from 'node:assert/strict';
import { compareThresholds } from './threshold-comparison.js';
const record = (score, label) => ({ label, skipped: null, analysis: { valid: true, supported: true, score, findings: [] } });
const report = () => ({ kind: 'development-evaluation', partition: 'development', summary: { totalInputs: 3, evaluatedInputs: 3 }, results: [record(10, 'phishing'), record(0, 'phishing'), record(20, 'legitimate')] });
test('Inclusive thresholds produce correct outcomes and score distribution', () => {
  const result = compareThresholds(report());
  assert.deepEqual(result.thresholds[0].counts, { tp: 1, fp: 1, fn: 1, tn: 0 });
  assert.deepEqual(result.thresholds[1].counts, { tp: 0, fp: 1, fn: 2, tn: 0 });
  assert.equal(result.thresholds[2].precision, null);
  assert.deepEqual(result.scoreDistribution[0], { score: 0, phishing: 1, legitimate: 0 });
});
test('Rejects holdout, invalid scores and inconsistent coverage', () => {
  const r = report(); r.partition = 'holdout'; assert.throws(() => compareThresholds(r));
  const s = report(); s.results[0].analysis.score = null; assert.throws(() => compareThresholds(s));
  const t = report(); t.summary.evaluatedInputs = 4; assert.throws(() => compareThresholds(t));
});
