import assert from "node:assert/strict";
import test from "node:test";
import { readFileSync } from "node:fs";
import { evaluateLabeledRecords } from "./labeled-evaluation.js";

const fixture = JSON.parse(readFileSync(new URL("./fixtures/synthetic-labeled.json", import.meta.url), "utf8"));

test("Full synthetic fixture reaches all outcomes and accounts for every input", () => {
  const result = evaluateLabeledRecords(fixture.records);
  assert.deepEqual(result.metrics.counts, { tp: 2, fp: 1, fn: 1, tn: 2 });
  assert.deepEqual(result.summary, {
    totalInputs: 13, evaluatedInputs: 6, excludedInputs: 7,
    exclusions: { conflictingLabel: 2, duplicate: 1, invalidUrl: 1, unsupportedUrl: 2, unknownLabel: 1 }
  });
  assert.equal(result.metrics.precision, 2 / 3);
  assert.equal(result.metrics.recall, 2 / 3);
  assert.equal(result.metrics.falsePositiveRate, 1 / 3);
  assert.equal(result.results.length, 13);
  assert(result.results.filter(r => r.skipped).every(r => r.outcome === null && r.flagged === null));
});

test("Threshold is inclusive and configurable without changing engine scores", () => {
  const records = [{ url: "http://192.0.2.1/", label: "phishing" }];
  assert.equal(evaluateLabeledRecords(records, { threshold: 30 }).metrics.counts.tp, 1);
  const higher = evaluateLabeledRecords(records, { threshold: 31 });
  assert.equal(higher.metrics.counts.fn, 1);
  assert.equal(higher.results[0].analysis.score, 30);
});

test("Unknown labels do not become legitimate labels", () => {
  const result = evaluateLabeledRecords([{ url: "https://example.com/", label: "Phishing" }]);
  assert.equal(result.summary.exclusions.unknownLabel, 1);
  assert.equal(result.metrics.evaluated, 0);
});

test("Conflicts quarantine all records for that exact URL", () => {
  const result = evaluateLabeledRecords(["phishing", "legitimate", "phishing"].map(label => ({url:"https://example.com/", label})));
  assert.equal(result.summary.exclusions.conflictingLabel, 3);
  assert.equal(result.metrics.evaluated, 0);
});

test("Known label is preferred over unknown duplicate regardless of order", () => {
  for (const labels of [[null, "legitimate"], ["legitimate", null]]) {
    const result = evaluateLabeledRecords(labels.map(label => ({url:"https://example.com/", label})));
    assert.equal(result.metrics.counts.tn, 1);
    assert.equal(result.summary.exclusions.duplicate, 1);
  }
});

test("Different paths and fragments are preserved", () => {
  const records = ["https://example.com/", "https://example.com/path", "https://example.com/#fragment"].map(url => ({url,label:"legitimate"}));
  const result = evaluateLabeledRecords(records);
  assert.equal(result.metrics.evaluated, 3);
  assert.deepEqual(result.results.map(r => r.url), records.map(r => r.url));
});

test("Unsupported and invalid inputs never become negatives even at threshold zero", () => {
  const result = evaluateLabeledRecords([
    {url:"chrome://extensions/",label:"legitimate"},
    {url:"invalid",label:"legitimate"}
  ], {threshold:0});
  assert.equal(result.metrics.evaluated, 0);
  assert.equal(result.metrics.accuracy, null);
});

test("Empty list produces zero coverage and undefined metrics", () => {
  const result = evaluateLabeledRecords([]);
  assert.equal(result.summary.totalInputs, 0);
  assert.equal(result.metrics.precision, null);
});

test("Malformed records and thresholds fail explicitly", () => {
  for (const value of [null, {}, [null], [{url:42}], [{url:"https://example.com/",label:1}]]) {
    assert.throws(() => evaluateLabeledRecords(value), TypeError);
  }
  for (const threshold of [-1, 101, NaN, Infinity, 1.5, "30"]) {
    assert.throws(() => evaluateLabeledRecords([], {threshold}), RangeError);
  }
});
