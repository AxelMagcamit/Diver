import assert from 'node:assert/strict';
import { mkdir, writeFile } from 'node:fs/promises';
import { analyzeUrl } from '../../extension/engine/analyzer.js';
import { challenges } from './fixtures/synthetic-challenges.js';

try {
  if (process.argv.length !== 2) throw new Error('Usage: npm run demo:challenges (no arguments).');
  console.log('SYNTHETIC LIMITATION DEMO — NOT DETECTION ACCURACY');
  console.log('All scenarios are invented. No websites are visited or labels verified.');
  const results = challenges.map(example => {
    const analysis = analyzeUrl(example.url);
    assert.equal(analysis.valid && analysis.supported, true, example.id);
    assert.equal(analysis.score, example.score, `${example.id}: score changed; review the scenario`);
    assert.deepEqual(analysis.findings.map(f => f.id), example.findings, `${example.id}: findings changed`);
    return { ...example, analysis, flaggedAt10: analysis.score >= 10, flaggedAt30: analysis.score >= 30 };
  });
  const byId = id => results.find(row => row.id === id);
  assert.deepEqual(byId('ordinary-path').analysis, byId('same-url-harmful-content').analysis, 'URL-only analysis cannot distinguish imagined page content');
  assert.equal(byId('ordinary-combined-signals').flaggedAt30, true);
  assert.equal(byId('short-hosted-page').flaggedAt10, false);
  console.table(results.map(row => ({ Case: row.id, Score: row.analysis.score, 'Flag at 10': row.flaggedAt10, 'Flag at 30': row.flaggedAt30 })));
  for (const row of results) console.log(`${row.id}: ${row.lesson}`);
  const report = { kind: 'synthetic-challenges', generatedAt: new Date().toISOString(), description: 'Invented scenarios illustrating URL-only rule limitations; no accuracy metrics or real labels.', results };
  const directory = new URL('../results/', import.meta.url);
  await mkdir(directory, { recursive: true });
  await writeFile(new URL('synthetic-challenges.json', directory), JSON.stringify(report, null, 2) + '\n');
  console.log(`${results.length}/${results.length} scenario checks passed. Saved evaluation/results/synthetic-challenges.json.`);
} catch (error) { console.error(`Challenge demo failed: ${error.message}`); process.exitCode = 1; }
