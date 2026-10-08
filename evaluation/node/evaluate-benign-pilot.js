import { readFile, writeFile, mkdir } from 'node:fs/promises';
import { createHash } from 'node:crypto';
import { auditBenignPilot } from './benign-pilot.js';
const sha = value => createHash('sha256').update(value).digest('hex');
try {
  const args = process.argv.slice(2);
  if (args.length && (args.length !== 1 || args[0] !== '--expanded')) throw new Error('Usage: npm run evaluate:benign-pilot [-- --expanded]');
  const expanded = args[0] === '--expanded';
  const root = new URL('../../', import.meta.url);
  const pilotRaw = await readFile(new URL(expanded ? 'datasets/processed/phreshphish-benign-multishard-v1.json' : 'datasets/processed/phreshphish-benign-pilot-v1.json', root));
  const manifest = JSON.parse(await readFile(new URL(expanded ? 'datasets/raw/phreshphish-multishard-v1/manifest.json' : 'datasets/raw/phreshphish-pilot-v1/manifest.json', root)));
  if (sha(pilotRaw) !== manifest.outputSha256) throw new Error('Pilot checksum mismatch.');
  const devRaw = await readFile(new URL('datasets/processed/phiusiil-split-v1/development.json', root));
  const devManifest = JSON.parse(await readFile(new URL('datasets/processed/phiusiil-split-v1/manifest.json', root)));
  if (sha(devRaw) !== devManifest.outputSha256['development.json']) throw new Error('Development checksum mismatch.');
  const pilot = JSON.parse(pilotRaw);
  const report = { kind: 'benign-development-pilot-audit', generatedAt: new Date().toISOString(), pilotSha256: sha(pilotRaw), comparisonDevelopmentSha256: sha(devRaw), provenance: pilot.provenance, ...auditBenignPilot(pilot, JSON.parse(devRaw)) };
  report.implementationSha256 = {};
  for (const path of ['extension/engine/analyzer.js','extension/engine/rules/url-structure.js','evaluation/node/domain-split.js','evaluation/node/benign-pilot.js','evaluation/node/evaluate-benign-pilot.js','package-lock.json']) report.implementationSha256[path] = sha(await readFile(new URL(path, root)));
  const directory = new URL('evaluation/results/', root);
  await mkdir(directory, { recursive: true });
  const name = `benign-${expanded ? 'multishard' : 'pilot'}-audit-${report.generatedAt.replace(/[:.]/g,'-')}.json`;
  await writeFile(new URL(name,directory), JSON.stringify(report,null,2)+'\n', { flag:'wx' });
  console.log(JSON.stringify({ ...report, provenance: undefined, results: undefined, excludedRecords: undefined, implementationSha256: undefined },null,2));
  console.log(`Saved evaluation/results/${name}. Source labels, ${expanded ? 'multi-shard' : 'single-shard'} development pilot; no precision or recall estimated.`);
} catch (error) { console.error(`Pilot audit failed: ${error.message}`); process.exitCode = 1; }
