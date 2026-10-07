import { calculateMetrics } from "./metrics.js";

// Invented outcome counts, not results produced by the Diver engine.
const examples = [
  { name: "Mixed outcomes", counts: { tp: 8, fp: 2, fn: 2, tn: 8 } },
  { name: "No alerts", counts: { tp: 0, fp: 0, fn: 3, tn: 7 } },
  { name: "No evaluated inputs", counts: { tp: 0, fp: 0, fn: 0, tn: 0 } }
];

const percent = value => value === null ? "N/A" : `${(value * 100).toFixed(1)}%`;

console.log("SYNTHETIC MATH DEMO — NOT DIVER DETECTION ACCURACY");
console.log("These invented counts verify the formulas. No URLs or datasets are analyzed.\n");

for (const example of examples) {
  const result = calculateMetrics(example.counts);
  console.log(example.name);
  console.table([{
    TP: result.counts.tp,
    FP: result.counts.fp,
    FN: result.counts.fn,
    TN: result.counts.tn,
    Evaluated: result.evaluated,
    Phishing: result.phishing,
    Legitimate: result.legitimate
  }]);
  console.table([{
    Precision: percent(result.precision),
    Recall: percent(result.recall),
    "False-positive rate": percent(result.falsePositiveRate),
    F1: percent(result.f1),
    Accuracy: percent(result.accuracy)
  }]);
}
