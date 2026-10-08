# Credential-path experiment — 8 October 2026

Decision: do not promote this candidate into the extension. The experiment is
retained for reproducibility, not as a production detection feature.

Hypothesis fixed before scoring: add 30 points for bounded login, signin,
sign-in, verify, verification or password tokens in an HTTP/HTTPS URL pathname;
decode percent escapes once where valid. Ignore hostname, query and fragment.
Keep the inclusive alert threshold at 30 and cap the total at 100.
Malformed percent escapes retain their original path text. This is a heuristic
test, not a claim that credential-related words prove phishing.

| Measure | Existing engine | Experimental candidate |
| --- | ---: | ---: |
| PhiUSIIL development true positives | 524 | 2,250 |
| PhiUSIIL development false negatives | 78,303 | 76,577 |
| PhiUSIIL development recall | 0.66% | 2.85% |
| PhiUSIIL development false positives | 0 | 0 |
| PhreshPhish benign-pilot false alerts | 0 / 4,636 | 71 / 4,636 |
| PhreshPhish benign-pilot false-positive rate | 0.00% | 1.53% |

The candidate adds 1,726 detections but still misses most labeled phishing URLs.
The legitimate PhiUSIIL URLs are homepages, so their zero false alerts are
particularly uninformative for a path-based rule. The separate benign pilot
shows the tradeoff: ordinary credential-related paths can trigger the candidate.
Do not pool these sources to compute a new precision estimate.

All 186,686 PhiUSIIL development records were evaluated. The benign pilot has
4,704 input records and 68 invalid/unsupported exclusions (the prior audit
identifies them as invalid URLs). No record was silently repaired. Samples use
source labels, not independently verified truth; domain/source and query-coverage
limitations remain. The candidate is evaluated on development data only. No
holdout was opened, no URL visited, and no popup/engine files changed.

Reproduce with `npm run experiment:path-signal`.
The runner verifies dataset hashes, records implementation hashes, and writes
timestamped reports under evaluation/results/. Newly flagged records are retained
with source IDs and baseline/candidate scores. Three tests cover token boundaries,
percent encoding, non-path terms, malformed inputs and benign ambiguity.

Next: consider a signal with stronger contextual evidence rather than adding
more broad keywords. Define the threat it detects, expected legitimate uses,
and required inputs before implementing another candidate. Preserve this baseline
and keep the holdout reserved for a frozen detector.
