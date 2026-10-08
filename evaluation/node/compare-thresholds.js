import { readFile, writeFile, mkdir } from 'node:fs/promises';
import { resolve } from 'node:path';
import { createHash } from 'node:crypto';
import { compareThresholds } from './threshold-comparison.js';

try {
  if (process.argv.length !== 3) throw new Error('Usage: npm run compare:thresholds -- path/to/development-baseline-report.json');
  const raw = await readFile(resolve(process.argv[2]));
  const baseline = JSON.parse(raw);
  const report = {
    kind: 'development-threshold-comparison', generatedAt: new Date().toISOString(),
    baselineSha256: createHash('sha256').update(raw).digest('hex'),
    inputSha256: baseline.inputSha256, provenance: baseline.provenance,
    baselineImplementationSha256: baseline.implementationSha256,
    ...compareThresholds(baseline)
  };
  const pct = value => value === null ? 'N/A' : `${(value * 100).toFixed(2)}%`;
  console.table(report.thresholds.map(row => ({ threshold: row.threshold, ...row.counts, precision: pct(row.precision), recall: pct(row.recall), falsePositiveRate: pct(row.falsePositiveRate), f1: pct(row.f1) })));
  console.table(report.scoreDistribution);
  console.log('Signal counts (a URL may match multiple rules):');
  console.table(report.signalCounts);
  const directory = new URL('../results/', import.meta.url);
  await mkdir(directory, { recursive: true });
  const name = `development-thresholds-${report.generatedAt.replace(/[:.]/g, '-')}.json`;
  await writeFile(new URL(name, directory), JSON.stringify(report, null, 2) + '\n', { flag: 'wx' });
  console.log(`Saved evaluation/results/${name}. Development only; no threshold automatically selected.`);
} catch (error) { console.error(`Threshold comparison failed: ${error.message}`); process.exitCode = 1; }
