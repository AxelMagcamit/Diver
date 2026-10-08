# PhreshPhish benign pilot audit — 8 October 2026

The unchanged shared engine evaluated the pinned 500-record training pilot.
Source benign labels are inherited, not independently verified. No network
requests or holdout reads were made during this audit.

Coverage: 489 evaluated (97.8%), 11 invalid URLs excluded, no exact duplicate
or unsupported-protocol exclusions. Excluded records and reasons are retained
in the report; no scheme or other URL component was silently repaired.

Among evaluated records: 487 HTTPS, 2 HTTP; 451 non-root paths, 38 root paths;
zero nonempty queries or fragments; 2 URLs longer than 150 normalized characters.
There are 423 domain groups, with at most 22 records per group. Normalized URL
lengths range from 18 to 186, with nearest-rank median 55.

| Threshold | False alerts / evaluated | False-positive rate |
| --- | ---: | ---: |
| 10 | 4 / 489 | 0.82% |
| 20 | 0 / 489 | 0.00% |
| 30 (current baseline) | 0 / 489 | 0.00% |
| 40, 50, 60 (each) | 0 / 489 | 0.00% |

There are zero exact URL matches with PhiUSIIL development, but 78 evaluated
records share a domain group with that partition. Separately excluding those
leaves 411 records: 3 alerts at threshold 10 (0.73%), zero at 20–60. This is a
development-overlap sensitivity check, not proof of independence from campaigns
or any holdout. No holdout was inspected for this comparison.

This confirms that the lower threshold can produce false alerts on source-labeled
benign examples. The sample is drawn from one training shard and has no queries,
so it does not estimate browsing-wide false-positive rates. Zero alerts at 30
does not establish safety or offset the low recall measured on PhiUSIIL.
Do not combine the two datasets' counts into a single precision estimate.
Recall and precision cannot be assessed from this benign-only sample.

Reproduce: `npm run evaluate:benign-pilot`.
The command checks both input hashes against their manifests, rejects incorrect
partitions/labels, and saves timestamped per-record results and implementation
hashes in evaluation/results/. Three tests cover exclusion reconciliation,
domain overlap, inclusive thresholds, empty denominators and input guards.

Next: inspect the four alerts and eleven parsing exclusions locally before
deciding whether to expand the sample or change any rule. Keep threshold 30
and all current engine rules unchanged for now.
