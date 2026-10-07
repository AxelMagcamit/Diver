// Pure arithmetic: these counts must come from an independently labeled evaluation.
// Rates are fractions from 0 to 1. A zero denominator produces null (N/A).
export function calculateMetrics(counts) {
  if (!counts || typeof counts !== "object" || Array.isArray(counts)) {
    throw new TypeError("Expected an object containing tp, fp, fn, and tn.");
  }

  for (const key of ["tp", "fp", "fn", "tn"]) {
    if (!Number.isSafeInteger(counts[key]) || counts[key] < 0) {
      throw new TypeError(`${key} must be a non-negative safe integer.`);
    }
  }

  const { tp, fp, fn, tn } = counts;
  const evaluated = tp + fp + fn + tn;
  if (!Number.isSafeInteger(evaluated)) {
    throw new RangeError("The total count exceeds the safe integer range.");
  }

  const ratio = (numerator, denominator) =>
    denominator === 0 ? null : numerator / denominator;

  return {
    counts: { tp, fp, fn, tn },
    evaluated,
    phishing: tp + fn,
    legitimate: fp + tn,
    flagged: tp + fp,
    notFlagged: fn + tn,
    precision: ratio(tp, tp + fp),
    recall: ratio(tp, tp + fn),
    falsePositiveRate: ratio(fp, fp + tn),
    f1: ratio(2 * tp, 2 * tp + fp + fn),
    accuracy: ratio(tp + tn, evaluated)
  };
}
