import { createHash } from 'node:crypto';
import { isIP } from 'node:net';
import { parse } from 'tldts';

export const DEFAULT_SEED = 'diver-phiusiil-v1';
export function domainGroup(value) {
  let url;
  try { url = new URL(value); } catch { return null; }
  if (!['http:', 'https:'].includes(url.protocol)) return null;
  const host = url.hostname.toLowerCase().replace(/\.+$/, '');
  const bare = host.replace(/^\[|\]$/g, '');
  if (isIP(bare)) return `ip:${bare}`;
  return `domain:${parse(host, { allowPrivateDomains: true }).domain || host}`;
}

export function splitRecords(records, { seed = DEFAULT_SEED, holdoutFraction = 0.2 } = {}) {
  if (!Array.isArray(records)) throw new Error('Records must be an array.');
  if (typeof seed !== 'string' || !seed.length) throw new Error('Seed must be a nonempty string.');
  if (!Number.isFinite(holdoutFraction) || holdoutFraction <= 0 || holdoutFraction >= 1) throw new Error('Holdout fraction must be between zero and one.');
  const byUrl = new Map();
  const exclusions = [];
  for (const record of records) {
    if (!record || typeof record.url !== 'string') { exclusions.push({ record, reason: 'invalidRecord' }); continue; }
    if (!byUrl.has(record.url)) byUrl.set(record.url, []);
    byUrl.get(record.url).push(record);
  }
  const development = [], holdout = [];
  for (const url of [...byUrl.keys()].sort()) {
    const rows = byUrl.get(url).slice().sort((a, b) => {
      const left = JSON.stringify(a), right = JSON.stringify(b);
      return left < right ? -1 : left > right ? 1 : 0;
    });
    const known = rows.filter(r => ['phishing', 'legitimate'].includes(r.label));
    if (new Set(known.map(r => r.label)).size > 1) {
      exclusions.push(...rows.map(record => ({ record, reason: 'conflictingLabel' })));
      continue;
    }
    const chosen = known[0] || rows[0];
    let taken = false;
    for (const record of rows) {
      if (record === chosen && !taken) { taken = true; continue; }
      exclusions.push({ record, reason: 'duplicate' });
    }
    if (!known.length) { exclusions.push({ record: chosen, reason: 'unknownLabel' }); continue; }
    const group = domainGroup(url);
    if (!group) { exclusions.push({ record: chosen, reason: 'invalidOrUnsupportedUrl' }); continue; }
    const hash = createHash('sha256').update(JSON.stringify([seed, group])).digest();
    const partition = hash.readUInt32BE(0) / 2 ** 32 < holdoutFraction ? holdout : development;
    partition.push({ ...chosen, domainGroup: group });
  }
  const summarize = rows => ({ records: rows.length, domainGroups: new Set(rows.map(r => r.domainGroup)).size, phishing: rows.filter(r => r.label === 'phishing').length, legitimate: rows.filter(r => r.label === 'legitimate').length });
  const devGroups = new Set(development.map(r => r.domainGroup));
  const overlap = new Set(holdout.filter(r => devGroups.has(r.domainGroup)).map(r => r.domainGroup)).size;
  const reasons = {};
  for (const entry of exclusions) reasons[entry.reason] = (reasons[entry.reason] || 0) + 1;
  if (overlap || development.length + holdout.length + exclusions.length !== records.length) throw new Error('Split reconciliation failed.');
  return { development, holdout, exclusions, summary: { inputRecords: records.length, development: summarize(development), holdout: summarize(holdout), excludedRecords: exclusions.length, exclusionReasons: reasons, overlappingDomainGroups: overlap } };
}
