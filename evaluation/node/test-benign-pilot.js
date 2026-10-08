import test from 'node:test';
import assert from 'node:assert/strict';
import { auditBenignPilot } from './benign-pilot.js';
const pilot = urls => ({ kind:'dataset', partition:'development-pilot', provenance:{split:'train'}, records:urls.map(url => ({url,label:'legitimate',sourceLabel:'benign'})) });
const development = {partition:'development',records:[{url:'https://www.example.com/'}]};
test('Reconciles exclusions and separates related-domain overlap', () => {
  const report = auditBenignPilot(pilot(['http://a.example.com/path','http://a.example.com/path','https://example.org/','bad','file:///tmp/x']),development);
  assert.equal(report.evaluated,2);
  assert.deepEqual(report.exclusions,{duplicate:1,invalidUrl:1,unsupportedUrl:1});
  assert.equal(report.exactDevelopmentOverlap,0);
  assert.equal(report.domainDevelopmentOverlap,1);
  assert.equal(report.all.thresholds[0].falsePositiveRate,0.5);
  assert.equal(report.withoutDevelopmentDomainOverlap.thresholds[0].falsePositiveRate,0);
});
test('Threshold 30 is inclusive and empty coverage yields null', () => {
  assert.equal(auditBenignPilot(pilot(['http://bücher.example/']),development).all.thresholds[2].falseAlerts,1);
  assert.equal(auditBenignPilot(pilot([]),development).all.thresholds[0].falsePositiveRate,null);
});
test('Rejects holdout and non-benign records', () => {
  assert.throws(() => auditBenignPilot(pilot([]),{...development,partition:'holdout'}));
  const p = pilot(['https://example.com']); p.records[0].label = 'phishing';
  assert.throws(() => auditBenignPilot(p,development));
});
