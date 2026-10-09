import test from "node:test";
import assert from "node:assert/strict";
import { analyzePasswordForms } from "../../extension/engine/form-analyzer.js";

function inspect(changes = {}, pageUrl = "https://example.com/login", extra = {}) {
  return analyzePasswordForms(pageUrl, [{
    hasPasswordField: true, namedEnabledPasswordFields: 1,
    action: "https://example.com/session", method: "post", submitterActions: [], ...changes
  }], extra);
}
const ids = result => result.findings.map(finding => finding.id);

test("Named enabled password field with GET produces an exposure warning", () => {
  assert.deepEqual(ids(inspect({method: "get"}).results[0]), ["FORM-GET"]);
});
test("No named enabled fields means no GET exposure finding", () => {
  assert.deepEqual(ids(inspect({method: "get", namedEnabledPasswordFields: 0}).results[0]), []);
});
test("Missing method defaults to GET", () => {
  assert.deepEqual(ids(inspect({method: null}).results[0]), ["FORM-GET"]);
});
test("A GET submit-button override warns without flagging the POST default", () => {
  const result = inspect({submitterActions: [{action: null, method: "get", disabled: false}]}).results[0];
  assert.deepEqual(ids(result), []);
  assert.deepEqual(ids(result.submitterResults[0]), ["FORM-GET"]);
});
test("Dialog submission produces no GET warning", () => {
  assert.deepEqual(ids(inspect({method: "dialog"}).results[0]), []);
});
test("An HTTP password page warns even with an HTTPS destination", () => {
  const report = inspect({}, "http://example.com/login");
  assert.deepEqual(report.pageFindings.map(finding => finding.id), ["FORM-HTTP-PAGE"]);
  assert.deepEqual(ids(report.results[0]), []);
  const unassociated = analyzePasswordForms("http://example.com/", [], {unassociatedPasswordFields: 1});
  assert.equal(unassociated.pageFindings[0].id, "FORM-HTTP-PAGE");
});
test("HTTPS POST produces neither of the new findings", () => {
  const report = inspect();
  assert.deepEqual(report.pageFindings, []);
  assert.deepEqual(ids(report.results[0]), []);
});
test("Missing metadata stays unknown and invalid metadata is rejected", () => {
  const result = inspect({method: "get", namedEnabledPasswordFields: undefined}).results[0];
  assert.equal(result.namedEnabledPasswordFields, null);
  assert.deepEqual(ids(result), []);
  assert.throws(() => inspect({namedEnabledPasswordFields: -1}), /non-negative integer/);
});
