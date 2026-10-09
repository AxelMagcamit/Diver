import test from 'node:test';
import assert from 'node:assert/strict';
import {getAutomaticWarning} from '../../extension/engine/warning-policy.js';
let sequence=0;
const KEY='diver-page-reputation-v1', HOUR=3600000;
async function fixture(run, stored={}) {
  const original={fetch:globalThis.fetch,chrome:globalThis.chrome,now:Date.now};
  const state={now:Date.now(),stored,calls:[],mode:'ok',body:null};
  Date.now=()=>state.now;
  globalThis.chrome={storage:{local:{get:async key=>({[key]:state.stored[key]}),set:async value=>{if(state.mode==='quota')throw Error('quota');Object.assign(state.stored,value);}}}};
  globalThis.fetch=async (url,settings)=>{
    state.calls.push({url,settings});if(state.mode==='offline')throw Error('offline');
    if(state.mode==='oversized')return new Response(new Uint8Array(8*1024*1024+1));
    return new Response(state.body??`! Updated: ${new Date(state.now).toISOString()}\n||sites.google.com/view/reported^$document\n||shared.example.test/login?campaign=reported^$document\n||whole.example.test^$document\n||shared.example.test/wild*^$document\n`);
  };
  try {await run(await import(`../../extension/engine/page-reputation.js?test=${sequence++}`),state);}
  finally {globalThis.fetch=original.fetch;globalThis.chrome=original.chrome;Date.now=original.now;}
}
test('Page matches preserve host, path and separator boundaries on shared services',async()=>fixture(async({checkPageReputation},state)=>{
  for(const url of ['https://sites.google.com/view/reported','http://sites.google.com/view/reported?token=private','https://sites.google.com/view/reported/next','https://sites.google.com/view/reported#fragment'])assert.equal((await checkPageReputation(url)).status,'listed',url);
  for(const url of ['https://sites.google.com/','https://sites.google.com/view/other','https://sites.google.com/view/reportedElse','https://sites.google.com/view/reported.html','https://sites.google.com/view/reported%2Fnext','https://sites.google.com/view/Reported','https://sub.sites.google.com/view/reported','https://sites.google.com.attacker.test/view/reported','https://sites.google.com:8443/view/reported','https://whole.example.test/','https://shared.example.test/wildcard'])assert.equal((await checkPageReputation(url)).status,'not-listed',url);
  assert.equal(state.calls.length,1);
}));
test('Query-specific reports retain their declared constraints without storing browsed tokens',async()=>fixture(async({checkPageReputation,PAGE_FEED},state)=>{
  assert.equal((await checkPageReputation('https://shared.example.test/login?campaign=reported&private=secret')).status,'listed');
  for(const url of ['https://shared.example.test/login','https://shared.example.test/login?campaign=other','https://shared.example.test/login?campaign=reportedExtra'])assert.equal((await checkPageReputation(url)).status,'not-listed');
  assert.equal(state.calls[0].url,PAGE_FEED);assert.equal(state.calls[0].settings.credentials,'omit');assert.equal(state.calls[0].settings.referrerPolicy,'no-referrer');
  assert.equal(JSON.stringify(state.stored).includes('private=secret'),false);
  assert.equal((await checkPageReputation('https://shared.example.test/')).skippedRules,1);
}));
test('Page warning identifies URL scope and does not echo query secrets',async()=>fixture(async({checkPageReputation})=>{
  const check=await checkPageReputation('https://sites.google.com/view/reported?private=secret');
  const result=getAutomaticWarning(null,null,{checks:[check]});assert.equal(result.warn,true);assert.match(result.reasons[0],/page matches/);assert.doesNotMatch(JSON.stringify(result),/secret|exact hostname/);
}));
test('Malformed, exception-bearing, empty, stale and future feeds do not activate',async()=>{
  for(const body of ['', '<html>error</html>',`! Updated: ${new Date().toISOString()}\n@@||shared.example.test/allowed^$document`, `! Updated: ${new Date().toISOString()}\n||whole.example.test^$document`,`! Updated: ${new Date(Date.now()-25*HOUR).toISOString()}\n||shared.example.test/a^$document`,`! Updated: ${new Date(Date.now()+HOUR).toISOString()}\n||shared.example.test/a^$document`])await fixture(async({checkPageReputation},state)=>{state.body=body;assert.equal((await checkPageReputation('https://shared.example.test/a')).status,'unavailable');assert.equal(Object.keys(state.stored).length,0);});
});
test('Offline refresh preserves a usable cache then stops matching at expiry',async()=>fixture(async({checkPageReputation},state)=>{
  await checkPageReputation('https://sites.google.com/view/reported');state.now+=13*HOUR;state.mode='offline';
  assert.equal((await checkPageReputation('https://sites.google.com/view/reported')).refreshDelayed,true);
  await checkPageReputation('https://sites.google.com/view/reported');assert.equal(state.calls.length,2);
  state.now+=11*HOUR;assert.equal((await checkPageReputation('https://sites.google.com/view/reported')).status,'unavailable');
}));
test('Concurrent refreshes share one request and reject oversized or unpersisted snapshots',async()=>{
  await fixture(async({checkPageReputation},state)=>{await Promise.all(Array.from({length:8},()=>checkPageReputation('https://sites.google.com/view/reported')));assert.equal(state.calls.length,1);});
  for(const mode of ['quota','oversized'])await fixture(async({checkPageReputation},state)=>{state.mode=mode;assert.equal((await checkPageReputation('https://sites.google.com/view/reported')).status,'unavailable');});
});
test('Unsupported URLs do not download and future cache timestamps request replacement',async()=>{
  await fixture(async({checkPageReputation},state)=>{for(const url of ['bad','chrome://settings','file:///test'])assert.equal((await checkPageReputation(url)).status,'unsupported');assert.equal(state.calls.length,0);});
  await fixture(async({checkPageReputation},state)=>{assert.equal((await checkPageReputation('https://sites.google.com/view/reported')).status,'listed');assert.equal(state.calls.length,1);},{[KEY]:{entries:[['sites.google.com','/view/reported']],fetchedAt:Date.now()+HOUR,sourceUpdatedAt:Date.now(),skippedRules:0}});
});
