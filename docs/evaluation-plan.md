# Diver detection-quality evaluation plan

## Purpose

Measure how well the existing shared URL engine distinguishes independently
labeled phishing URLs from legitimate URLs. The 22 engine tests verify expected
behavior; they do not establish phishing detection accuracy.

This plan does not change the current rules, weights, popup, or input runner.
No datasets have been downloaded and no accuracy results have been measured.

## First experiment

- Keep the current five rules and weights fixed as the baseline.
- Treat a score of **30 or more** as flagged for the initial experiment. This
  matches the popup's current Suspicious boundary, including High risk results.
- Scores below 30 are not flagged at this threshold; this does not mean safe.
- Compare thresholds 10, 20, 30, 40, 50, and 60 on development data. Do not
  automatically change the popup's thresholds based on these comparisons.
- A score is a heuristic total, not a percentage probability of phishing.

## Outcomes

| Independent label | Diver flags it | Diver does not flag it |
|---|---|---|
| Phishing | True positive: detected threat | False negative: missed threat |
| Legitimate | False positive: false alarm | True negative: correctly not flagged |

## Metrics to report together

- **Precision:** TP / (TP + FP). Of the URLs flagged, how many were labeled phishing?
- **Recall:** TP / (TP + FN). Of the phishing URLs, how many did Diver flag?
- **False-positive rate:** FP / (FP + TN). Of the legitimate URLs, how many caused false alarms?
- **F1:** 2TP / (2TP + FP + FN). A combined measure of precision and recall.
- **Accuracy:** (TP + TN) / (TP + TN + FP + FN). Useful context, but insufficient
  on its own when one class is much more common.

Report all four outcome counts, class counts, and the threshold alongside the
metrics. Express ratios as percentages where helpful. A metric with a zero
denominator is N/A, not zero or 100%. Precision changes with the proportion of
phishing in the sample, so a balanced test set does not establish real-world precision.

## Eligibility and coverage

Only valid, supported HTTP/HTTPS URLs with a known independent label enter the
confusion matrix. Report invalid inputs, unsupported protocols, unknown labels,
and conflicting labels separately; never turn skipped inputs into true negatives.
Report total inputs and evaluated inputs so exclusions cannot conceal poor coverage.
An unexpected engine error fails the evaluation instead of counting as a safe result.

## Requirements for future labeled data

Record each URL's label, source, source record ID if available, and the date of
the label or observation. Labels must come from independent evidence, not from
Diver's score or URL features. HTTP, Punycode, or a long URL alone cannot establish
a phishing label. A well-known domain alone cannot establish every URL on it is legitimate.

Preserve the original URL. Remove exact duplicate URL records before splitting,
and quarantine conflicting labels. Document any further normalization; do not
silently discard paths, queries, or fragments because rules may depend on them.

Separate development and final test data before tuning. Keep URLs belonging to
the same registrable domain in one split; use the exact host for IP addresses.
Record source and date distributions and check for campaign overlap where known.
Choose thresholds on development data only, then evaluate the frozen configuration
once on the held-out test set. Repeated tuning on that set requires a new holdout.

Review false alarms and missed threats, especially legitimate internationalized
domains, long URLs, and plain HTTP pages. Report the limitations of the labels,
sample age, sources, and coverage. This is URL-only analysis, not page-content analysis.

## Next implementation checkpoint

Build a small metrics calculator and verify its arithmetic with explicitly
synthetic examples. Keep those fixtures separate from real labeled data and
clearly mark their results as a calculation demonstration, not detection accuracy.

For example, invented counts TP=8, FP=2, FN=2, TN=8 produce precision 80%, recall
80%, false-positive rate 20%, F1 80%, and accuracy 80%. These are not Diver results.

Only after that will we select and review data sources. No numerical quality
target has been agreed yet; do not claim the detector is validated or ready for
deployment based on these examples or the existing unit tests.
