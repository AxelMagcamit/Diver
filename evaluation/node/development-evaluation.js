import { createHash } from 'node:crypto';
import { evaluateLabeledRecords } from './labeled-evaluation.js';

export function evaluateDevelopment(raw, manifest) {
  const hash = createHash('sha256').update(raw).digest('hex');
  if (hash !== manifest?.outputSha256?.['development.json']) throw new Error('Development file checksum does not match the split manifest.');
  const dataset = JSON.parse(raw.toString());
  if (dataset.kind !== 'dataset' || dataset.partition !== 'development') throw new Error('Only the development partition may be evaluated here.');
  if (!Array.isArray(dataset.records) || dataset.records.length !== manifest.summary?.development?.records) throw new Error('Development record count does not match the manifest.');
  return {
    kind: 'development-evaluation', partition: 'development', inputSha256: hash,
    provenance: dataset.provenance, splitSeed: manifest.seed,
    ...evaluateLabeledRecords(dataset.records, { threshold: 30 })
  };
}
