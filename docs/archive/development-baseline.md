# Development baseline: 8 October 2026

The unchanged shared URL engine was evaluated at score >= 30 on the fixed
PhiUSIIL development partition. All 186,686 records were evaluated; none were
excluded by the evaluator. The holdout was not scored.

| Outcome | Count |
| --- | ---: |
| True positives | 524 |
| False positives | 0 |
| False negatives | 78,303 |
| True negatives | 107,859 |

| Metric | Result |
| --- | ---: |
| Precision | 100.00% |
| Recall | 0.66% |
| False-positive rate | 0.00% |
| F1 | 1.32% |
| Accuracy | 58.06% |

Only 524 of 78,827 URLs labeled phishing were flagged. The baseline misses most
phishing examples in this development sample. Zero observed false alarms and
100% precision describe these 524 flags in this historical sample; they do not
establish perfect real-world precision or zero future false alarms.
Always predicting legitimate would have accuracy 57.78% on this sample, so the
headline accuracy provides little evidence of useful phishing detection.

Scores are rule totals, not phishing probabilities. Labels are inherited from
the source and have not been independently verified. Domain separation does not
eliminate campaign or template overlap, and historical data may not represent
current browsing. This is URL-only analysis; no websites were visited.

Reproduce with `npm run evaluate:development`. The fixed input is
datasets/processed/phiusiil-split-v1/development.json. The runner verifies its
checksum and record count against manifest.json and rejects other partition
markers. Reports retain per-record outcomes, provenance, input and manifest
hashes, threshold, and hashes of the engine and evaluator implementations.
Reports are timestamped and Git-ignored under evaluation/results/.

Next: compare the planned thresholds on development data and inspect missed
examples offline before changing rules. Do not tune using the holdout or
automatically change the popup threshold based on this baseline.
