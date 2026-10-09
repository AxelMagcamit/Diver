# Expanded benign pilot — 8 October 2026

Pinned PhreshPhish revision eabec4b7a66324b79cc8a0ad856d1731dc26fe1a.
Selected ten evenly spaced paths in the sorted list of 56 training shards:
000, 006, 012, 018, 024, 030, 036, 042, 048, 055.
Only the first min(2000, shard row count) rows were eligible in each shard.
Up to 500 source-labeled benign records per window were selected by the lowest
SHA-256 ranks with seed diver-phreshphish-multishard-v1. The final shard supplied
204 benign records; the others supplied 500 each. Selection used no engine scores.

This yields 4,704 records. It is stratified by chosen file/window, not a random
sample of the entire dataset. It overlaps the earlier single-shard pilot; do not
add their counts or treat them as independent samples.

Retrieval used 5,199,462 bytes of exact footer and selected-column ranges. The
manifest retains each range hash, publisher file hash, schema and window counts.
Full remote file hashes were not independently verified. HTML was not decoded,
and dataset URLs were not visited. Dates and source labels were preserved.

## Audit and evaluation

- 4,636 evaluated; 68 invalid URL exclusions; zero duplicates or unsupported URLs.
- 3,252 domain groups; largest group has 176 records.
- 4,317 non-root paths, 319 root paths; no queries or fragments.
- 20 HTTP, 4,616 HTTPS; 44 normalized URLs longer than 150 characters.
- Normalized lengths: minimum 16, nearest-rank median 56, maximum 736.

| Threshold | False alerts / evaluated | Rate |
| --- | ---: | ---: |
| 10 | 64 / 4,636 | 1.38% |
| 20–60, each | 0 / 4,636 | 0.00% |

Zero exact URL overlap with PhiUSIIL development; 830 records share a domain
group. Removing those leaves 3,806 evaluated records with 50 alerts at 10 (1.31%)
and zero at 20–60. This sensitivity check does not establish campaign independence.
No holdout data was read. Input hashes were checked before evaluation; all three
existing benign-audit tests passed after adding the expanded-run option.

The score>=30 setting, rules and popup remain unchanged. Zero observed alerts
does not establish zero future false alarms. Source labels are not independently
verified; query coverage remains missing. Precision and recall cannot be measured
from a benign-only sample, and metrics must not be pooled with PhiUSIIL.

## Reproduction

```powershell
npm ci --prefix evaluation/tools/phreshphish --ignore-scripts
node evaluation/tools/phreshphish/prepare-multishard.mjs
npm run evaluate:benign-pilot -- --expanded
```

The retrieval writes a new ignored multishard-url-only folder beside its script,
refusing an existing destination. It uses a 20 MB requested-byte cap per shard.
The saved project inputs are datasets/raw/phreshphish-multishard-v1/ and
datasets/processed/phreshphish-benign-multishard-v1.json. To use a reproduction,
verify its manifest output hash and place its bundle and benign-pilot.json at
those input locations without replacing an existing checkpoint blindly.
Reports are saved as evaluation/results/benign-multishard-audit-*.json.

Attribution: Dalton et al., PhreshPhish (2025), arXiv:2507.10854. Repository:
https://huggingface.co/datasets/phreshphish/phreshphish (CC BY 4.0; publisher
requests anti-phishing research use).

Next: save a Git checkpoint of the completed evaluation work, then choose the
next detection improvement using the documented misses and false-alert tradeoff.
Do not lower thresholds automatically based on these separate source samples.
