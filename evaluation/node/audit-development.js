import { readFile, writeFile, mkdir } from 'node:fs/promises';
import { createHash } from 'node:crypto';
import { resolve } from 'node:path';
import { compareThresholds } from './threshold-comparison.js';

const hash = value => createHash('sha256').update(value).digest('hex');
const defang = value => value.replace(/^https:/i, 'hxxps:').replace(/^http:/i, 'hxxp:').replaceAll('.', '[.]');
try {
  if (process.argv.length !== 3) throw new Error('Usage: npm run audit:development -- path/to/development-baseline-report.json');
  const raw = await readFile(resolve(process.argv[2]));
  const baseline = JSON.parse(raw);
  compareThresholds(baseline); // Reuse development-only coverage and score checks.
  const groups = {};
  for (const row of baseline.results) {
    if (row.skipped !== null) continue;
    const name = row.label === 'legitimate' ? 'legitimate' : row.analysis.score === 0 ? 'phishingScoreZero' : row.analysis.score < 30 ? 'phishingScore1to29' : 'phishingFlaggedAt30';
    if (!groups[name]) groups[name] = { records: 0, https: 0, rootPath: 0, nonRootPath: 0, query: 0, fragment: 0, wwwPrefix: 0, lengths: [], samples: [] };
    const group = groups[name], url = new URL(row.url);
    group.records++;
    group.https += Number(url.protocol === 'https:');
    group.rootPath += Number(url.pathname === '/');
    group.nonRootPath += Number(url.pathname !== '/');
    group.query += Number(Boolean(url.search));
    group.fragment += Number(Boolean(url.hash));
    group.wwwPrefix += Number(url.hostname.startsWith('www.'));
    group.lengths.push(url.href.length);
    // Fixed hash ordering selects examples without favoring striking patterns.
    const rank = hash(JSON.stringify(['diver-development-audit-v1', row.url]));
    group.samples.push({ rank, sourceRecordId: row.sourceRecordId, sourceRow: row.sourceRow, label: row.label, score: row.analysis.score, url: defang(row.url), normalizedLength: url.href.length, findings: row.analysis.findings.map(f => f.id) });
    group.samples.sort((a, b) => a.rank < b.rank ? -1 : a.rank > b.rank ? 1 : 0);
    if (group.samples.length > 8) group.samples.pop();
  }
  for (const group of Object.values(groups)) {
    group.lengths.sort((a, b) => a - b);
    const quantile = p => group.lengths[Math.ceil(p * group.lengths.length) - 1];
    group.normalizedLength = { min: group.lengths[0], medianNearestRank: quantile(0.5), p95NearestRank: quantile(0.95), max: group.lengths.at(-1) };
    delete group.lengths;
  }
  const report = { kind: 'development-pattern-audit', generatedAt: new Date().toISOString(), baselineSha256: hash(raw), inputSha256: baseline.inputSha256, provenance: baseline.provenance, sampling: 'Eight lowest SHA-256 ranks per group using fixed seed diver-development-audit-v1; URLs defanged; examples are not independent label verification.', groups };
  const directory = new URL('../results/', import.meta.url);
  await mkdir(directory, { recursive: true });
  const name = `development-audit-${report.generatedAt.replace(/[:.]/g, '-')}.json`;
  await writeFile(new URL(name, directory), JSON.stringify(report, null, 2) + '\n', { flag: 'wx' });
  console.log(JSON.stringify(Object.fromEntries(Object.entries(groups).map(([key, group]) => [key, { ...group, samples: undefined }])), null, 2));
  console.log(`Saved evaluation/results/${name}. No network requests or holdout scoring.`);
} catch (error) { console.error(`Development audit failed: ${error.message}`); process.exitCode = 1; }
