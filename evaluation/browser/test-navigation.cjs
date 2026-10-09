const path=require('node:path'),assert=require('node:assert/strict');
const {chromium}=require(process.env.DIVER_PLAYWRIGHT_PATH ?? 'playwright');
const extension=process.argv[2]??path.resolve(__dirname,'../../extension');
(async()=>{
 const server=require('node:http').createServer((request,response)=>{
  const url=new URL(request.url,'http://navigation.example.test');
  if(url.pathname==='/redirect'){response.writeHead(302,{location:'/reported'});return response.end();}
  response.setHeader('Content-Type','text/html');
  response.end(url.pathname==='/client-redirect'?'<!doctype html><script>location.replace("/reported")</script>':'<!doctype html><title>Harmless navigation fixture</title><p>No forms or submissions.</p>');
 });
 await new Promise((resolve,reject)=>{server.once('error',reject);server.listen(80,'127.0.0.1',resolve);});
 let context;
 try {
  context=await chromium.launchPersistentContext(require('node:fs').mkdtempSync(path.join(require('node:os').tmpdir(),'diver-navigation-')),{...(process.env.DIVER_CHROME_PATH ? {executablePath:process.env.DIVER_CHROME_PATH} : {channel:'chromium'}),headless:true,args:[`--disable-extensions-except=${extension}`,`--load-extension=${extension}`,'--host-resolver-rules=MAP navigation.example.test 127.0.0.1','--no-proxy-server']});
  let worker=context.serviceWorkers()[0];if(!worker)worker=await context.waitForEvent('serviceworker');const id=worker.url().split('/')[2];
  await worker.evaluate(async now=>chrome.storage.local.set({
   'diver-reputation-v1':{blocklist:['unused.example.test'],allowlist:[],fetchedAt:now},
   'diver-general-reputation-v1':{domains:['unused.example.test'],fetchedAt:now,sourceUpdatedAt:now},
   'diver-page-reputation-v1':{entries:[['navigation.example.test','/reported'],['navigation.example.test','/reported-two']],skippedRules:0,fetchedAt:now,sourceUpdatedAt:now}
  }),Date.now());
  const inspector=await context.newPage();await inspector.goto(`chrome-extension://${id}/popup/popup.html`);
  const main=await context.newPage();
  const count=()=>inspector.evaluate(()=>chrome.extension.getViews({type:'popup'}).length);
  const warning=async()=>{await inspector.waitForFunction(expected=>chrome.extension.getViews({type:'popup'}).some(view=>view.document.getElementById('current-url')?.textContent===expected && view.document.getElementById('automatic-warning')?.textContent.includes('page matches')),main.url(),{timeout:15000});await main.waitForTimeout(200);};
  const dismiss=async()=>{await inspector.evaluate(()=>chrome.extension.getViews({type:'popup'}).forEach(view=>view.close()));await inspector.waitForFunction(()=>chrome.extension.getViews({type:'popup'}).length===0);};
  await main.goto('http://navigation.example.test/redirect');await main.bringToFront();await warning();await dismiss();console.log('PASS: HTTP redirect final destination opens warning');
  await main.evaluate(()=>history.pushState({},'', '/reported-two'));await warning();await dismiss();console.log('PASS: changed same-document destination warns after previous dismissal');
  await main.evaluate(()=>{location.hash='section';document.body.append(document.createElement('form'));});await main.waitForTimeout(2500);assert.equal(await count(),0);console.log('PASS: fragment and repeat scans do not reopen dismissed warning');
  await main.evaluate(()=>history.replaceState({},'', '/reported?campaign=changed'));await warning();await dismiss();console.log('PASS: replaceState destination change warns');
  await main.goto('http://navigation.example.test/client-redirect');await main.bringToFront();await warning();await dismiss();console.log('PASS: JavaScript redirect final destination warns');
  await main.goto('http://navigation.example.test/reported');await main.goto('http://navigation.example.test/clean');await main.bringToFront();await main.waitForTimeout(2500);assert.equal(await count(),0);console.log('PASS: rapid navigation ends without a stale warning on clean page');
 }finally{if(context)await context.close();server.close();}
})().catch(error=>{console.error(error);process.exitCode=1;});
