import { analyzeUrl } from "../../extension/engine/analyzer.js";
import { calculateMetrics } from "./metrics.js";

const knownLabel = label => label === "phishing" || label === "legitimate";

// Evaluate supplied labels; do not derive ground truth from URL features.
export function evaluateLabeledRecords(records, { threshold = 30 } = {}) {
  if (!Number.isInteger(threshold) || threshold < 0 || threshold > 100) {
    throw new RangeError("Threshold must be an integer from 0 to 100.");
  }
  if (!Array.isArray(records)) throw new TypeError("Expected an array of records.");

  const groups = new Map();
  records.forEach((record, index) => {
    if (!record || typeof record !== "object" || Array.isArray(record) ||
        typeof record.url !== "string" ||
        (record.label != null && typeof record.label !== "string")) {
      throw new TypeError(`Record ${index + 1} needs a URL string and a string or null label.`);
    }
    if (!groups.has(record.url)) groups.set(record.url, []);
    groups.get(record.url).push(index);
  });

  const counts = { tp: 0, fp: 0, fn: 0, tn: 0 };
  const exclusions = { conflictingLabel: 0, duplicate: 0, invalidUrl: 0, unsupportedUrl: 0, unknownLabel: 0 };
  const results = new Array(records.length);
  function skip(index, reason, analysis = null) {
    exclusions[reason]++;
    results[index] = { ...records[index], index, outcome: null, flagged: null, skipped: reason, analysis };
  }

  for (const indexes of groups.values()) {
    const labels = new Set(indexes.map(i => records[i].label).filter(knownLabel));
    // Quarantine every record for a URL with contradictory known labels.
    if (labels.size > 1) {
      indexes.forEach(i => skip(i, "conflictingLabel"));
      continue;
    }

    // Prefer a known label over a missing/unknown label for the same exact URL.
    const selected = indexes.find(i => knownLabel(records[i].label)) ?? indexes[0];
    indexes.filter(i => i !== selected).forEach(i => skip(i, "duplicate"));
    const record = records[selected];
    // Unexpected engine exceptions propagate and fail the evaluation.
    const analysis = analyzeUrl(record.url);
    if (!analysis.valid) { skip(selected, "invalidUrl", analysis); continue; }
    if (!analysis.supported) { skip(selected, "unsupportedUrl", analysis); continue; }
    if (!knownLabel(record.label)) { skip(selected, "unknownLabel", analysis); continue; }

    const flagged = analysis.score >= threshold;
    const outcome = record.label === "phishing"
      ? (flagged ? "tp" : "fn")
      : (flagged ? "fp" : "tn");
    counts[outcome]++;
    results[selected] = { ...record, index: selected, outcome, flagged, skipped: null, analysis };
  }

  const metrics = calculateMetrics(counts);
  return {
    threshold,
    summary: {
      totalInputs: records.length,
      evaluatedInputs: metrics.evaluated,
      excludedInputs: records.length - metrics.evaluated,
      exclusions
    },
    metrics,
    results
  };
}
