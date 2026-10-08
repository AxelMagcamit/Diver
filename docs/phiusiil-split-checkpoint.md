# PhiUSIIL domain-separated split

This checkpoint partitions the imported data without running the detection engine.

| Partition | Records | Phishing labels | Legitimate labels | Domain groups |
| --- | ---: | ---: | ---: | ---: |
| Development | 186,686 | 78,827 | 107,859 | 157,740 |
| Holdout | 48,684 | 21,693 | 26,991 | 39,561 |

Of 235,795 imported rows, 425 extra exact URL duplicates were excluded. There
were zero overlapping domain groups. The output reconciles every input row.
Labels are inherited from the source, not independently verified.

The fixed seed is `diver-phiusiil-v1`. SHA-256 of JSON.stringify([seed, group])
assigns each whole group to holdout when the first unsigned 32 bits divided by
2^32 is below 0.2. This makes the split reproducible, not exactly class-balanced.
Do not try alternate seeds to obtain preferred evaluation results.

Grouping uses tldts 7.4.16 with private suffixes enabled. Subdomains of one
registrable domain stay together; separate private hosting tenants can be
separate groups. IP addresses are canonicalized; unknown suffixes fall back to
the parsed hostname when no registrable domain is available. URL text itself
is preserved. Exact duplicate URL strings are removed; conflicting known labels
quarantine all rows for that exact URL. Unknown labels and invalid/unsupported
URLs are excluded. Representatives are selected deterministically.

Outputs are local and Git-ignored in datasets/processed/phiusiil-split-v1/:
development.json, holdout.json, exclusions.json, and manifest.json. The manifest
records the source hash, provenance, dependency version, lockfile and split
implementation hashes, output hashes, settings, counts and exclusions.

The full suite passed 58 checks, including eight split tests covering grouping,
private suffixes, IP/IDNA handling, determinism, exclusion accounting and validation.

Domain separation does not guarantee independent campaigns, page templates or
redirect destinations. Equivalent URL spellings may remain. This historical
dataset is not evidence of present-day detection quality. No accuracy has been
computed here. Next, evaluate only development.json with the shared URL engine;
reserve holdout.json until the rules and threshold are fixed.
