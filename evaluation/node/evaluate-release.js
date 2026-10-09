import {readFile,writeFile,mkdir} from 'node:fs/promises';
import {createHash} from 'node:crypto';
import {fileURLToPath} from 'node:url';
import {analyzeUrl} from '../../extension/engine/analyzer.js';
import {checkReputation,REPUTATION_FEED} from '../../extension/engine/reputation.js';
import {getAutomaticWarning} from '../../extension/engine/warning-policy.js';
const root=new URL('../../',import.meta.url);
const args=process.argv.slice(2);
if(args.length!==2)throw Error('Usage: npm run evaluate:release -- <feed.json> <source.json>');
const sha=data=>createHash('sha256').update(data).digest('hex');
const feedRaw=await readFile(args[0]);
const source=JSON.parse(await readFile(args[1]));
if(!/^[a-f0-9]{40}$/.test(source.revision)||source.sourceUrl!=='https://raw.githubusercontent.com/MetaMask/eth-phishing-detect/'+source.revision+'/src/config.json'||!Number.isFinite(Date.parse(source.retrievedAt)))throw Error('Invalid pinned source metadata');
let downloads=0;let stored={};
globalThis.chrome={storage:{local:{get:async key=>({[key]:stored[key]}),set:async value=>Object.assign(stored,value)}}};
globalThis.fetch=async url=>{if(url!==REPUTATION_FEED)throw Error('Unexpected outbound request');downloads++;return new Response(feedRaw);};
const counts=()=>({TP:0,FP:0,FN:0,TN:0});
const add=(c,label,warn)=>{c[label==='phishing'?(warn?'TP':'FN'):(warn?'FP':'TN')]++;};
const metric=c=>({...c,precision:c.TP+c.FP?c.TP/(c.TP+c.FP):null,recall:c.TP+c.FN?c.TP/(c.TP+c.FN):null,falsePositiveRate:c.FP+c.TN?c.FP/(c.FP+c.TN):null});
async function evaluate(inputPath,manifestPath,pilot=false){
 const raw=await readFile(new URL(inputPath,root));
 const manifestRaw=await readFile(new URL(manifestPath,root));
 const manifest=JSON.parse(manifestRaw);const dataset=JSON.parse(raw);
 const expected=pilot?manifest.outputSha256:manifest.outputSha256?.['development.json'];
 if(sha(raw)!==expected)throw Error('Input checksum mismatch');
 if(dataset.partition!==(pilot?'development-pilot':'development'))throw Error('Wrong partition');
 if(!pilot && dataset.records.length!==manifest.summary.development.records)throw Error('Count mismatch');
 const report={input:inputPath,inputSha256:sha(raw),manifestSha256:sha(manifestRaw),inputRecords:dataset.records.length,evaluated:0,excluded:0,reputation:counts(),urlWarning:counts(),combinedAutomatic:counts(),popupScore30:counts(),reputationUnavailable:0};
 for(const record of dataset.records){
  if(!['phishing','legitimate'].includes(record.label))throw Error('Invalid label');
  const url=analyzeUrl(record.url);
  if(!url.valid||!url.supported){report.excluded++;continue;}
  const reputation=await checkReputation(record.url);
  if(reputation.status==='unavailable')report.reputationUnavailable++;
  report.evaluated++;
  add(report.reputation,record.label,reputation.status==='listed');
  add(report.urlWarning,record.label,getAutomaticWarning(url,null).warn);
  add(report.combinedAutomatic,record.label,getAutomaticWarning(url,null,reputation).warn);
  add(report.popupScore30,record.label,url.score>=30);
 }
 for(const key of ['reputation','urlWarning','combinedAutomatic','popupScore30'])report[key]=metric(report[key]);
 return report;
}
const report={kind:'release-url-reputation-development-check',generatedAt:new Date().toISOString(),source:{...source,sha256:sha(feedRaw)},limitations:['Historical development labels, not independent current threat verification.','No DOM available: password-form layer NOT evaluated.','Provider overlap with source datasets unknown; not an independent accuracy estimate.','No holdout read, no website visited, no rule tuning.'],implementationSha256:{},datasets:[]};
for(const input of [['datasets/processed/phiusiil-split-v1/development.json','datasets/processed/phiusiil-split-v1/manifest.json',false],['datasets/processed/phreshphish-benign-multishard-v1.json','datasets/raw/phreshphish-multishard-v1/manifest.json',true]])report.datasets.push(await evaluate(...input));
for(const file of ['extension/engine/reputation.js','extension/engine/analyzer.js','extension/engine/rules/url-structure.js','extension/engine/warning-policy.js'])report.implementationSha256[file]=sha(await readFile(new URL(file,root)));
report.sourceDownloadsFromLocalSnapshot=downloads;
if(downloads!==1)throw Error('Unexpected snapshot load count');
const dir=new URL('evaluation/results/',root);await mkdir(dir,{recursive:true});
const name='release-hybrid-'+report.generatedAt.replace(/[:.]/g,'-')+'.json';
await writeFile(new URL(name,dir),JSON.stringify(report,null,2)+'\n',{flag:'wx'});

console.log(JSON.stringify(report,null,2));console.log('Saved '+fileURLToPath(new URL(name,dir)));
