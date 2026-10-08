import { readFile, mkdir, writeFile } from 'node:fs/promises';
import { createHash } from 'node:crypto';
import { analyzeUrl } from '../../extension/engine/analyzer.js';
import { calculateMetrics } from './metrics.js';
import { domainGroup } from './domain-split.js';
import { credentialPathSignal } from './candidate-path-signal.js';
const hash = data => createHash('sha256').update(data).digest('hex');
const root = new URL('../../', import.meta.url);
const read = async path => readFile(new URL(path, root));
try {
  if (process.argv.length !== 2) throw new Error('This experiment takes no arguments.');
  const devRaw = await read('datasets/processed/phiusiil-split-v1/development.json');
  const devManifest = JSON.parse(await read('datasets/processed/phiusiil-split-v1/manifest.json'));
  const benignRaw = await read('datasets/processed/phreshphish-benign-multishard-v1.json');
  const benignManifest = JSON.parse(await read('datasets/raw/phreshphish-multishard-v1/manifest.json'));
  if (hash(devRaw) !== devManifest.outputSha256['development.json'] || hash(benignRaw) !== benignManifest.outputSha256) throw new Error('Input checksum mismatch.');
  const dev = JSON.parse(devRaw), benign = JSON.parse(benignRaw);
  if (dev.partition !== 'development' || benign.partition !== 'development-pilot' || benign.provenance.split !== 'train') throw new Error('Wrong input partition.');
  const devDomains = new Set(dev.records.map(r => domainGroup(r.url)));
  function experiment(records, benignOnly = false) {
    const counts = () => ({tp:0,fp:0,fn:0,tn:0});
    const baseline = counts(), candidate = counts();
    const exclusions = {duplicate:0,invalidOrUnsupported:0};
    const seen = new Set(), newlyFlagged = [];
    let matches = 0;
    for (const record of records) {
      if (!['phishing','legitimate'].includes(record.label) || (benignOnly && (record.label !== 'legitimate' || record.sourceLabel !== 'benign'))) throw new Error('Unexpected label.');
      if (seen.has(record.url)) { exclusions.duplicate++; continue; }
      seen.add(record.url);
      const analysis = analyzeUrl(record.url);
      if (!analysis.valid || !analysis.supported) { exclusions.invalidOrUnsupported++; continue; }
      const match = credentialPathSignal(record.url);
      matches += Number(match);
      const score = Math.min(100, analysis.score + (match ? 30 : 0));
      const baseFlag = analysis.score >= 30, candidateFlag = score >= 30;
      const outcome = flag => record.label === 'phishing' ? (flag ? 'tp':'fn') : (flag ? 'fp':'tn');
      baseline[outcome(baseFlag)]++; candidate[outcome(candidateFlag)]++;
      if (!baseFlag && candidateFlag) newlyFlagged.push({sourceRecordId:record.sourceRecordId,sourceRow:record.sourceRow,sourceFile:record.sourceFile,label:record.label,url:record.url,baselineScore:analysis.score,candidateScore:score,domainDevelopmentOverlap:devDomains.has(domainGroup(record.url))});
    }
    const bm = calculateMetrics(baseline), cm = calculateMetrics(candidate);
    return {inputRecords:records.length,evaluated:bm.evaluated,exclusions,matches,baseline:benignOnly ? {falseAlerts:bm.counts.fp,falsePositiveRate:bm.falsePositiveRate}:bm,candidate:benignOnly ? {falseAlerts:cm.counts.fp,falsePositiveRate:cm.falsePositiveRate}:cm,newlyFlagged};
  }
  const report = {kind:'development-rule-experiment',generatedAt:new Date().toISOString(),hypothesis:'Credential-related path tokens add 30 points; inclusive alert threshold stays 30. Experimental only, not adopted.',inputs:{phiusiil:hash(devRaw),phreshphish:hash(benignRaw)},provenance:{phiusiil:dev.provenance,phreshphish:benign.provenance},phiusiil:experiment(dev.records),phreshphish:experiment(benign.records,true)};
  report.implementationSha256 = {};
  for (const path of ['extension/engine/analyzer.js','extension/engine/rules/url-structure.js','evaluation/node/candidate-path-signal.js','evaluation/node/experiment-path-signal.js','evaluation/node/metrics.js','evaluation/node/domain-split.js','package-lock.json']) report.implementationSha256[path]=hash(await read(path));
  const dir = new URL('evaluation/results/',root); await mkdir(dir,{recursive:true});
  const name = `path-signal-experiment-${report.generatedAt.replace(/[:.]/g,'-')}.json`;
  await writeFile(new URL(name,dir),JSON.stringify(report,null,2)+'\n',{flag:'wx'});
  console.log(JSON.stringify({phiusiil:{...report.phiusiil,newlyFlagged:report.phiusiil.newlyFlagged.length},phreshphish:{...report.phreshphish,newlyFlagged:report.phreshphish.newlyFlagged.length}},null,2));
  console.log(`Saved evaluation/results/${name}. Candidate only; extension unchanged.`);
} catch (error) { console.error(error.message); process.exitCode=1; }
