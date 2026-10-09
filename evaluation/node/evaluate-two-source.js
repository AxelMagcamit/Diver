import {readFile,writeFile} from 'node:fs/promises';
import {createHash} from 'node:crypto';
import {checkReputation,REPUTATION_FEED} from '../../extension/engine/reputation.js';
import {checkHybridReputation} from '../../extension/engine/hybrid-reputation.js';
import {GENERAL_FEED} from '../../extension/engine/general-reputation.js';
import {analyzeUrl} from '../../extension/engine/analyzer.js';
import {getAutomaticWarning} from '../../extension/engine/warning-policy.js';
const root=new URL('../../',import.meta.url);
const args=process.argv.slice(2);
if(args.length!==2 && !(args.length===4 && args[2]==='--at'))throw Error('Usage: npm run evaluate:two-source -- <metamask.json> <general-hosts.txt> [--at <UTC-time>]');
const evaluationAt=args.length===4?Date.parse(args[3]):Date.now();
if(!Number.isFinite(evaluationAt))throw Error('Invalid evaluation time');
Date.now=()=>evaluationAt;
const meta=await readFile(args[0]);
const general=await readFile(args[1]);
const sha=x=>createHash('sha256').update(x).digest('hex');
let storage={};let requests=[];
globalThis.chrome={storage:{local:{get:async key=>({[key]:storage[key]}),set:async values=>Object.assign(storage,values)}}};
globalThis.fetch=async url=>{requests.push(url);if(url===REPUTATION_FEED)return new Response(meta);if(url===GENERAL_FEED)return new Response(general);throw Error('Unexpected request');};
const report={kind:'two-source-development-comparison',evaluationAt:new Date(evaluationAt).toISOString(),generatedAt:new Date().toISOString(),sourceHashes:{MetaMask:sha(meta),malwareFilter:sha(general)},sourceUrl:GENERAL_FEED,sourceUpdatedAt:general.toString().match(/^# Updated: (.+)$/m)?.[1],datasets:[],limitations:['Historical development sources, not independently verified current labels.','No page/form data; form layer not scored.','Provider/dataset overlap unknown; not a real-world accuracy estimate.','No threshold tuning or holdout use.']};
for(const [file,manifestFile,pilot] of [['datasets/processed/phiusiil-split-v1/development.json','datasets/processed/phiusiil-split-v1/manifest.json',false],['datasets/processed/phreshphish-benign-multishard-v1.json','datasets/raw/phreshphish-multishard-v1/manifest.json',true]]){
 const raw=await readFile(new URL(file,root));const manifest=JSON.parse(await readFile(new URL(manifestFile,root)));
 if(sha(raw)!==(pilot?manifest.outputSha256:manifest.outputSha256['development.json']))throw Error('Checksum mismatch');
 const dataset=JSON.parse(raw);if(dataset.partition!==(pilot?'development-pilot':'development'))throw Error('Invalid partition');
 const counters={input:file,inputSha256:sha(raw),evaluated:0,excluded:0,phishing:0,legitimate:0,baselineTP:0,baselineFP:0,updatedTP:0,updatedFP:0,unavailableChecks:0};
 for(const record of dataset.records){
  if(!['phishing','legitimate'].includes(record.label))throw Error('Invalid label');
  const url=analyzeUrl(record.url);if(!url.valid||!url.supported){counters.excluded++;continue;}
  const previous=await checkReputation(record.url);
  const current=await checkHybridReputation(record.url);
  if(current.coverageIncomplete)counters.unavailableChecks++;
  counters.evaluated++;counters[record.label]++;
  const key=record.label==='phishing'?'TP':'FP';
  if(getAutomaticWarning(url,null,previous).warn)counters['baseline'+key]++;
  if(getAutomaticWarning(url,null,current).warn)counters['updated'+key]++;
 }
 report.datasets.push(counters);
}
report.sourceRequests=requests;report.cacheBytes=Buffer.byteLength(JSON.stringify(storage));
report.metaHosts=storage['diver-reputation-v1'].blocklist.length;
report.generalHosts=storage['diver-general-reputation-v1'].domains.length;
const old=new Set(storage['diver-reputation-v1'].blocklist);report.additionalHosts=storage['diver-general-reputation-v1'].domains.filter(host=>!old.has(host)).length;
report.implementationSha256={};
for(const file of ['extension/engine/reputation.js','extension/engine/general-reputation.js','extension/engine/hybrid-reputation.js','extension/engine/warning-policy.js'])report.implementationSha256[file]=sha(await readFile(new URL(file,root)));
if(report.datasets.some(x=>x.unavailableChecks))throw Error('Evaluation had unavailable sources');


await writeFile(new URL('evaluation/results/two-source-'+report.generatedAt.replace(/[:.]/g,'-')+'.json',root),JSON.stringify(report,null,2)+'\n');
console.log(JSON.stringify(report,null,2));
