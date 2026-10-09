# Benign pilot case review — 8 October 2026

Inspected the four threshold-10 alerts and all eleven exclusions from
evaluation/results/benign-pilot-audit-2026-10-08T04-10-33-780Z.json.
This was an offline review of stored URL strings, not page visits or independent
verification of the source's benign labels.

## Four alerts

| Stored URL context | Finding | Score | Normalized length |
| --- | --- | ---: | ---: |
| Nutrition page, myubcard.com | URL-001: HTTP | 10 | 44 |
| Wiki page, fandom.com | URL-001: HTTP | 10 | 37 |
| Article path, spglobal.com | URL-005: long URL | 10 | 163 |
| Article path, psucollegian.com | URL-005: long URL | 10 | 186 |

The long URLs contain descriptive article paths rather than query strings.
The fandom.com example shares a domain group with PhiUSIIL development; the
other three do not. All four trigger at threshold 10, none at threshold 30.
The rules behaved as written. These observations support treating HTTP and
length as weak signals, not proof of phishing. No domain whitelist or rule
weight change is justified by four source-labeled examples.

## Eleven parsing exclusions

All eleven stored strings lack an explicit scheme. They contain host/path text,
which new URL(input) without a base cannot parse as absolute URLs. In an offline
diagnostic, all eleven parse if prefixed with either http:// or https://.
Neither successful parse establishes the original scheme or confirms a live site.

Preserve original source strings and keep them excluded from baseline metrics.
Do not silently prepend HTTPS: doing so would suppress any HTTP-rule signal.
Do not prepend HTTP either: it would introduce an assumed signal. If a later
normalization experiment is desired, record it as a separate sensitivity analysis
with explicit assumptions and a separate denominator.

The source-labeled sample therefore remains 500 inputs, 489 evaluated and 11
excluded. The current score >=30 setting and all rules remain unchanged.
No holdout data was opened. This is input-format handling, not evidence of a
browser-extension URL-reading failure.

The local case-review JSON retains each case's source ID/row, triggering rules,
lengths, overlap indicator and parsing diagnostics, together with the SHA-256 of
the source audit. It is saved as evaluation/results/benign-pilot-case-review.json.

Next: expand the exploratory benign pilot across multiple pinned training
shards with a fixed selection procedure. Audit exclusions and URL-shape coverage
before interpreting new false-alert rates. This can reduce reliance on one
shard but cannot recover query strings removed by the dataset publisher.
