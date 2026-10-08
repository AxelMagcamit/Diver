# Development URL-pattern audit — 8 October 2026

Audited the saved development baseline offline. No holdout records were read,
no websites visited, and no rule or popup behavior changed.

| Group | Records | HTTPS | Non-root path | Query present | Median normalized length |
| --- | ---: | ---: | ---: | ---: | ---: |
| Legitimate labels | 107,859 | 107,859 | 0 | 0 | 28 |
| Phishing labels, score 0 | 36,206 | 36,206 | 15,423 | 2,285 | 44 |
| Phishing labels, score 1–29 | 42,097 | 1,176 | 6,716 | 2,211 | 29 |
| Phishing labels, score >=30 | 524 | 2 | 406 | 319 | 190 |

All legitimate-labeled records have a www-prefixed hostname, HTTPS, root path,
no query and no fragment. Normalized lengths range from 17 to 59 characters.
This is a strong class-specific representation pattern. It does not establish
why the source was constructed this way, nor prove incorrect labels.

Consequently, the observed zero false alarms do not assess legitimate HTTP URLs,
long links, internationalized domains, or normal paths and query strings. A rule
that exploits missing www or the presence of a path could simply exploit this
dataset's representation, rather than improve phishing detection.

All 36,206 zero-score phishing-labeled URLs use HTTPS and have normalized length
at most 150, consistent with the existing rules. They also trigger no IPv4,
Punycode or user-information findings. 20,783 have root paths; 15,423 do not.
The five rules therefore lack signals for this entire group.

Eight examples per group were selected by the lowest SHA-256 ranks of
JSON.stringify(['diver-development-audit-v1', originalUrl]), independent of
interesting-looking keywords. They are retained in the local report with source
record IDs, defanged URLs, lengths and finding IDs. The inspected zero-score
sample includes hosting-service subdomains and a shortened link. This small
sample is descriptive, not a prevalence estimate or independent verification
that a URL was or remains phishing. Do not blacklist whole hosting platforms
or TLDs based on these examples.

Reproduce using:

```powershell
npm run audit:development -- evaluation/results/development-baseline-2026-10-08T03-35-35-971Z.json
```

The report is timestamped under evaluation/results/ and records the baseline
SHA-256, input hash, provenance, exact counts and fixed sampling procedure.
Root path means URL.pathname === '/'; query and fragment counts reflect parsed
nonempty values. Lengths use URL.href; medians and p95 use nearest-rank quantiles.

Next: build a clearly labeled synthetic challenge suite of legitimate-shaped
HTTP, long, internationalized and ordinary path/query URLs to demonstrate rule
limitations. Synthetic expectations must not be mixed with independently labeled
accuracy metrics. Then review a more representative legitimate data source before
tuning or claiming detector quality. Reserve the existing holdout for final use.
