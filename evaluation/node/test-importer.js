import test from "node:test";
import assert from "node:assert/strict";
import { mkdtemp, writeFile, unlink, rmdir } from "node:fs/promises";
import { tmpdir } from "node:os";
import { join } from "node:path";
import { createHash } from "node:crypto";
import { importPhiusiil } from "./phiusiil-importer.js";

async function check(csv, callback, overrides = {}) {
  const directory = await mkdtemp(join(tmpdir(), "diver-import-test-"));
  const file = join(directory, "sample.csv");
  await writeFile(file, csv);
  const metadata = { kind:"synthetic", sourceName:"Invented test", sourceUrl:"urn:diver:synthetic", license:"Project test fixture", retrievedAt:null, observedAt:null, csvSha256:createHash("sha256").update(csv).digest("hex"), ...overrides };
  try { await callback(() => importPhiusiil(file, metadata)); }
  finally { await unlink(file); await rmdir(directory); }
}

test("Maps labels correctly, preserves commas, and ignores multiline features", async () => {
  await check('FILENAME,URL,label,Other\r\nx,"https://example.com/?a=1,b=2",1,"line one\r\nline ""two"""\r\ny,http://192.0.2.1/,0,z', async run => {
    const result = await run();
    assert.deepEqual(result.summary,{importedRecords:2,phishing:1,legitimate:1});
    assert.equal(result.records[0].url,'https://example.com/?a=1,b=2');
    assert.equal(result.records[0].label,'legitimate');
    assert.equal(result.records[1].label,'phishing');
    assert.equal(result.records[0].observedAt,null);
    assert.equal(result.records[0].Other,undefined);
  });
});
test("Handles a UTF-8 BOM and fallback record IDs", async () => {
  await check('\uFEFFURL,label\nhttps://example.com/,1',async run=>{
    assert.equal((await run()).records[0].sourceRecordId,'record-1');
  });
});
test("Retains duplicate and invalid URL records for a later audit", async () => {
  await check('URL,label\ninvalid,0\ninvalid,1',async run=>{
    const r=await run();assert.equal(r.records.length,2);assert.equal(r.records[0].url,'invalid');
  });
});
test("Rejects missing or duplicate required headers", async () => {
  for(const csv of ['url,label\nx,1','URL,label,label\nx,0,1']) {
    await check(csv,async run=>assert.rejects(run,/columns|column/));
  }
});
test("Rejects unexpected labels instead of silently reversing or guessing", async () => {
  for(const label of ['2','phishing',' 0','']) {
    await check(`URL,label\nhttps://example.com/,${label}`,async run=>assert.rejects(run,/exactly 0 or 1/));
  }
});
test("Rejects malformed quoting and inconsistent row lengths", async () => {
  for(const csv of ['URL,label\n"unclosed,1','URL,label\nx,1,extra']) {
    await check(csv,async run=>assert.rejects(run));
  }
});
test("Rejects a changed source file by checksum", async () => {
  await check('URL,label\nx,1',async run=>assert.rejects(run,/checksum/),{csvSha256:'0'.repeat(64)});
});
test("Requires provenance and distinguishes retrieval date from observation date", async () => {
  for(const overrides of [{sourceName:''},{csvSha256:''},{kind:'dataset',retrievedAt:null},{observedAt:'unknown'}]) {
    await check('URL,label\nx,1',async run=>assert.rejects(run,TypeError),overrides);
  }
  await check('URL,label\nx,1',async run=>assert.equal((await run()).records[0].observedAt,null),{kind:'dataset',retrievedAt:'2026-10-07T00:00:00Z'});
});
test("Rejects empty and header-only input", async () => {
  for(const csv of ['', 'URL,label\n']) await check(csv,async run=>assert.rejects(run,/no data/));
});
