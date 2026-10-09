import test from 'node:test';
import assert from 'node:assert/strict';
import {claimWarning,releaseWarning} from '../../extension/engine/warning-state.js';

function fixture(run) {
  const originalDocument=globalThis.document;
  const originalState=globalThis.__diverWarningState;
  globalThis.document={URL:'https://example.test/reported'};
  delete globalThis.__diverWarningState;
  try {run();} finally {
    if(originalDocument===undefined)delete globalThis.document;else globalThis.document=originalDocument;
    if(originalState===undefined)delete globalThis.__diverWarningState;else globalThis.__diverWarningState=originalState;
  }
}
test('Repeat scans of the warned destination remain suppressed',()=>fixture(()=>{
  assert.equal(claimWarning(document.URL,'first'),true);
  assert.equal(claimWarning(document.URL,'repeat'),false);
}));
test('A different path or query can warn in the same document',()=>fixture(()=>{
  claimWarning(document.URL,'first');
  for(const url of ['https://example.test/reported-two','https://example.test/reported-two?campaign=other']){
    document.URL=url;assert.equal(claimWarning(url,url),true);
    assert.equal(claimWarning(url,'repeat'),false);
  }
}));
test('Fragment-only changes do not reopen a dismissed destination warning',()=>fixture(()=>{
  claimWarning(document.URL,'first');document.URL+='#section';
  assert.equal(claimWarning(document.URL,'second'),false);
}));
test('Stale scans cannot claim a changed destination',()=>fixture(()=>{
  assert.equal(claimWarning('https://example.test/old','stale'),false);
  assert.equal(globalThis.__diverWarningState,undefined);
}));
test('Failed popup attempts release only their own claim and permit retry',()=>fixture(()=>{
  claimWarning(document.URL,'first');releaseWarning('first');
  assert.equal(claimWarning(document.URL,'retry'),true);
}));
test('An older failure cannot clear a newer destination claim',()=>fixture(()=>{
  claimWarning(document.URL,'old');document.URL='https://example.test/new';
  claimWarning(document.URL,'new');releaseWarning('old');
  assert.equal(claimWarning(document.URL,'repeat'),false);
  assert.equal(globalThis.__diverWarningState.warningClaim.token,'new');
}));
test('Claim and rollback preserve the collector watcher state',()=>fixture(()=>{
  globalThis.__diverWarningState={watching:true};claimWarning(document.URL,'first');releaseWarning('first');
  assert.deepEqual(globalThis.__diverWarningState,{watching:true});
}));
