import { analyzeUrl } from '../../extension/engine/analyzer.js';
import { domainGroup } from './domain-split.js';

export function auditBenignPilot(pilot, development) {
  if (pilot?.kind !== 'dataset' || pilot.partition !== 'development-pilot' || pilot.provenance?.split !== 'train' || !Array.isArray(pilot.records)) throw new Error('Expected a training-derived development pilot.');
  if (development?.partition !== 'development' || !Array.isArray(development.records)) throw new Error('Expected the development comparison partition.');
  const devUrls = new Set(development.records.map(r => r.url));
  const devDomains = new Set(development.records.map(r => domainGroup(r.url)).filter(Boolean));
  const seen = new Set(), results = [], excludedRecords = [], exclusions = { duplicate: 0, invalidUrl: 0, unsupportedUrl: 0 };
  const exclude = (record, reason) => { exclusions[reason]++; excludedRecords.push({ ...record, reason }); };
  const shapes = { http: 0, https: 0, rootPath: 0, nonRootPath: 0, query: 0, fragment: 0, longerThan150: 0 };
  const domains = new Map(), lengths = [];
  for (const record of pilot.records) {
    if (record?.label !== 'legitimate' || record.sourceLabel !== 'benign' || typeof record.url !== 'string') throw new Error('Pilot must contain only source-labeled benign URL records.');
    if (seen.has(record.url)) { exclude(record, 'duplicate'); continue; }
    seen.add(record.url);
    const analysis = analyzeUrl(record.url);
    if (!analysis.valid) { exclude(record, 'invalidUrl'); continue; }
    if (!analysis.supported) { exclude(record, 'unsupportedUrl'); continue; }
    const url = new URL(record.url), group = domainGroup(record.url);
    domains.set(group, (domains.get(group) || 0) + 1);
    lengths.push(url.href.length);
    shapes.http += Number(url.protocol === 'http:'); shapes.https += Number(url.protocol === 'https:');
    shapes.rootPath += Number(url.pathname === '/'); shapes.nonRootPath += Number(url.pathname !== '/');
    shapes.query += Number(Boolean(url.search)); shapes.fragment += Number(Boolean(url.hash));
    shapes.longerThan150 += Number(url.href.length > 150);
    results.push({ ...record, domainGroup: group, exactDevelopmentOverlap: devUrls.has(record.url), domainDevelopmentOverlap: devDomains.has(group), analysis });
  }
  const summarize = rows => ({ evaluated: rows.length, thresholds: [10,20,30,40,50,60].map(threshold => {
    const falseAlerts = rows.filter(r => r.analysis.score >= threshold).length;
    return { threshold, falseAlerts, notFlagged: rows.length - falseAlerts, falsePositiveRate: rows.length ? falseAlerts / rows.length : null };
  }) });
  lengths.sort((a,b) => a-b);
  return {
    inputRecords: pilot.records.length, evaluated: results.length, exclusions, excludedRecords, shapes,
    domainGroups: domains.size, largestDomainGroupRecords: Math.max(0,...domains.values()),
    normalizedLength: { min: lengths[0] ?? null, medianNearestRank: lengths[Math.ceil(lengths.length / 2)-1] ?? null, max: lengths.at(-1) ?? null },
    exactDevelopmentOverlap: results.filter(r => r.exactDevelopmentOverlap).length,
    domainDevelopmentOverlap: results.filter(r => r.domainDevelopmentOverlap).length,
    all: summarize(results), withoutDevelopmentDomainOverlap: summarize(results.filter(r => !r.domainDevelopmentOverlap)), results
  };
}
