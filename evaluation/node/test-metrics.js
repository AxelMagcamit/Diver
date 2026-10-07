import assert from "node:assert/strict";
import test from "node:test";
import { calculateMetrics } from "./metrics.js";

test("Known synthetic example gives 80% precision/recall and 20% false alarms", () => {
  assert.deepEqual(calculateMetrics({ tp: 8, fp: 2, fn: 2, tn: 8 }), {
    counts: { tp: 8, fp: 2, fn: 2, tn: 8 },
    evaluated: 20, phishing: 10, legitimate: 10, flagged: 10, notFlagged: 10,
    precision: .8, recall: .8, falsePositiveRate: .2, f1: .8, accuracy: .8
  });
});

test("Unequal class counts use the correct metric denominators", () => {
  const result = calculateMetrics({ tp: 3, fp: 1, fn: 2, tn: 4 });
  assert.equal(result.precision, .75);
  assert.equal(result.recall, .6);
  assert.equal(result.falsePositiveRate, .2);
  assert.equal(result.f1, 2 / 3);
  assert.equal(result.accuracy, .7);
});

test("No alerts means undefined precision, not perfect precision", () => {
  const result = calculateMetrics({ tp: 0, fp: 0, fn: 3, tn: 7 });
  assert.equal(result.precision, null);
  assert.equal(result.recall, 0);
  assert.equal(result.f1, 0);
  assert.equal(result.falsePositiveRate, 0);
  assert.equal(result.accuracy, .7);
});

test("An empty evaluation has no defined rates", () => {
  const result = calculateMetrics({ tp: 0, fp: 0, fn: 0, tn: 0 });
  for (const key of ["precision", "recall", "falsePositiveRate", "f1", "accuracy"]) {
    assert.equal(result[key], null, key);
  }
  assert.equal(result.evaluated, 0);
});

test("A phishing-only sample has no false-positive-rate denominator", () => {
  const result = calculateMetrics({ tp: 5, fp: 0, fn: 0, tn: 0 });
  assert.equal(result.falsePositiveRate, null);
  assert.equal(result.precision, 1);
  assert.equal(result.recall, 1);
  assert.equal(result.f1, 1);
  assert.equal(result.accuracy, 1);
});

test("Legitimate-only sample with alerts has undefined recall", () => {
  const result = calculateMetrics({ tp: 0, fp: 2, fn: 0, tn: 8 });
  assert.equal(result.recall, null);
  assert.equal(result.precision, 0);
  assert.equal(result.falsePositiveRate, .2);
  assert.equal(result.f1, 0);
  assert.equal(result.accuracy, .8);
});

test("Correctly unflagged legitimate-only sample has undefined F1", () => {
  const result = calculateMetrics({ tp: 0, fp: 0, fn: 0, tn: 8 });
  assert.equal(result.precision, null);
  assert.equal(result.recall, null);
  assert.equal(result.f1, null);
  assert.equal(result.falsePositiveRate, 0);
  assert.equal(result.accuracy, 1);
});

test("Completely incorrect predictions produce zero precision and recall", () => {
  const result = calculateMetrics({ tp: 0, fp: 4, fn: 6, tn: 0 });
  assert.equal(result.precision, 0);
  assert.equal(result.recall, 0);
  assert.equal(result.falsePositiveRate, 1);
  assert.equal(result.f1, 0);
  assert.equal(result.accuracy, 0);
});

test("Reject malformed counts instead of silently creating misleading rates", () => {
  for (const key of ["tp", "fp", "fn", "tn"]) {
    for (const value of [-1, .5, NaN, Infinity, "2", null, undefined]) {
      assert.throws(() => calculateMetrics({ tp: 0, fp: 0, fn: 0, tn: 0, [key]: value }), TypeError);
    }
  }
  for (const value of [undefined, null, [], "counts", {}]) {
    assert.throws(() => calculateMetrics(value), TypeError);
  }
});

test("Reject totals beyond JavaScript's exact integer range", () => {
  assert.throws(() => calculateMetrics({ tp: Number.MAX_SAFE_INTEGER, fp: 1, fn: 0, tn: 0 }), RangeError);
});
