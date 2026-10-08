import { readFile, writeFile, mkdir } from 'node:fs/promises';
import { resolve, join } from 'node:path';
import { createHash } from 'node:crypto';
import { DEFAULT_SEED, splitRecords } from './domain-split.js';

const sha256 = data => createHash('sha256').update(data).digest('hex');
try {
  const args = process.argv.slice(2);
  if (args.length !== 2) throw new Error('Usage: npm run split:dataset -- input.json new-output-directory');
  const raw = await readFile(resolve(args[0]));
  const input = JSON.parse(raw);
  if (input.kind !== 'dataset' || !Array.isArray(input.records)) throw new Error('Input must be an imported dataset.');
  const split = splitRecords(input.records);
  const directory = resolve(args[1]);
  const packageInfo = JSON.parse(await readFile(new URL('../../package.json', import.meta.url)));
  const files = {};
  for (const partition of ['development', 'holdout']) {
    files[`${partition}.json`] = JSON.stringify({ kind: 'dataset', schemaVersion: 1, partition, provenance: input.provenance, records: split[partition] }, null, 2) + '\n';
  }
  files['exclusions.json'] = JSON.stringify(split.exclusions, null, 2) + '\n';
  const manifest = {
    schemaVersion: 1, sourceSha256: sha256(raw), provenance: input.provenance,
    seed: DEFAULT_SEED, holdoutFraction: 0.2,
    algorithm: 'SHA-256(JSON.stringify([seed, domainGroup])); first unsigned 32 bits / 2^32 < holdoutFraction',
    grouping: 'Registrable domain with private suffixes enabled; canonical IP or hostname fallback',
    deduplication: 'Exact URL strings; conflicting known labels quarantined',
    tldtsVersion: packageInfo.dependencies.tldts,
    lockfileSha256: sha256(await readFile(new URL('../../package-lock.json', import.meta.url))),
    implementationSha256: sha256(await readFile(new URL('./domain-split.js', import.meta.url))),
    summary: split.summary,
    outputSha256: Object.fromEntries(Object.entries(files).map(([name, contents]) => [name, sha256(contents)]))
  };
  // Nonrecursive creation deliberately refuses an existing output directory.
  await mkdir(directory);
  for (const [name, contents] of Object.entries(files)) await writeFile(join(directory, name), contents, { flag: 'wx' });
  await writeFile(join(directory, 'manifest.json'), JSON.stringify(manifest, null, 2) + '\n', { flag: 'wx' });
  console.log(JSON.stringify(split.summary, null, 2));
  console.log(`Split saved to ${directory}. No detection scores were calculated.`);
} catch (error) { console.error(`Split failed: ${error.message}`); process.exitCode = 1; }
