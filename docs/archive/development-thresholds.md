# Development threshold comparison

Compared the saved baseline scores on 8 October 2026. No URLs were visited,
rules changed, or holdout records read. The report records the baseline SHA-256
and preserves its dataset and implementation provenance.

| Threshold (inclusive) | True positives | False positives | False negatives | Recall | F1 |
| --- | ---: | ---: | ---: | ---: | ---: |
| 10 | 42,621 | 0 | 36,206 | 54.07% | 70.19% |
| 20 | 953 | 0 | 77,874 | 1.21% | 2.39% |
| 30 | 524 | 0 | 78,303 | 0.66% | 1.32% |
| 40 | 299 | 0 | 78,528 | 0.38% | 0.76% |
| 50 | 0 | 0 | 78,827 | 0.00% | 0.00% |
| 60 | 0 | 0 | 78,827 | 0.00% | 0.00% |

All 107,859 legitimate-labeled examples scored zero. Precision is 100% for
thresholds 10–40 on this sample and undefined for 50–60, which flag nothing.
This does not demonstrate zero real-world false alarms. HTTP, long URLs and
internationalized domains can occur on legitimate sites.

36,206 phishing-labeled examples scored zero; 41,668 scored exactly 10.
The HTTP rule matched 41,443 phishing-labeled examples; long URL matched 1,798,
IP hostname 447, Punycode 128, and user information 3. Matches overlap.
Lowering the threshold cannot distinguish the zero-score phishing and legitimate
examples with the current score. Threshold 10 has the highest F1 of the six
tested values, but has not been adopted for the popup.

Next: audit development-only zero-score misses and the all-zero legitimate
distribution offline. Investigate source sampling and URL representation before
adding rules. Keep holdout reserved until rules and threshold are frozen.

Reproduce with:

```powershell
npm run compare:thresholds -- evaluation/results/development-baseline-2026-10-08T03-35-35-971Z.json
```

This command requires a development evaluation report, reconciles its coverage,
validates scores, and writes a timestamped comparison in evaluation/results/.
It accepts saved scores without requiring them to match today's engine; the
baseline implementation hashes identify the engine version being compared.
