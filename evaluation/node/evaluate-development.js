import { readFile, mkdir, writeFile } from 'node:fs/promises';
import { createHash } from 'node:crypto';
import { evaluateDevelopment } from './development-evaluation.js';

try {
  if (process.argv.length !== 2) throw new Error('Usage: npm run evaluate:development (no arguments).');
  const root = new URL('../../', import.meta.url);
  const raw = await readFile(new URL('datasets/processed/phiusiil-split-v1/development.json', root));
  const manifestRaw = await readFile(new URL('datasets/processed/phiusiil-split-v1/manifest.json', root));
  const report = evaluateDevelopment(raw, JSON.parse(manifestRaw));
  const hash = bytes => createHash('sha256').update(bytes).digest('hex');
  report.generatedAt = new Date().toISOString();
  report.manifestSha256 = hash(manifestRaw);
  report.implementationSha256 = {};
  for (const file of ['extension/engine/analyzer.js', 'extension/engine/rules/url-structure.js', 'evaluation/node/labeled-evaluation.js', 'evaluation/node/metrics.js', 'evaluation/node/development-evaluation.js', 'evaluation/node/evaluate-development.js']) {
    report.implementationSha256[file] = hash(await readFile(new URL(file, root)));
  }
  const directory = new URL('evaluation/results/', root);
  await mkdir(directory, { recursive: true });
  const name = `development-baseline-${report.generatedAt.replace(/[:.]/g, '-')}.json`;
  await writeFile(new URL(name, directory), JSON.stringify(report) + '\n', { flag: 'wx' });
  console.log('DEVELOPMENT BASELINE — historical source labels; not final holdout performance');
  console.log('Flagged when score >= 30. No websites visited.');
  console.log(JSON.stringify({ summary: report.summary, metrics: report.metrics }, null, 2));
  console.log(`Report saved to evaluation/results/${name}`);
} catch (error) {
  console.error(`Development evaluation failed: ${error.message}`);
  process.exitCode = 1;
}
