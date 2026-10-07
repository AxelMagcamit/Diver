# Diver data-source review

Reviewed: 2026-10-07. Documentation only; no datasets downloaded.

## Recommended first source: UCI PhiUSIIL

The [official UCI record](https://archive.ics.uci.edu/dataset/967/phiusil-phishing-url-dataset)
lists 235,795 records: 134,850 legitimate and 100,945 phishing URLs, with a URL
column and CC BY 4.0 licensing. It was donated on March 3, 2024. The listed CSV
is 54.2 MB and the download archive is 14.7 MB.

The documented label mapping is **0 = phishing; 1 = legitimate**. Preserve that
mapping explicitly. Attribute Arvind Prasad and Shalini Chandra and link the
source and license in any derived data manifest.

Recommendation: use this as a historical, offline baseline, not evidence of
current protection. Feed only original URLs into Diver; ignore the supplied
engineered features when computing predictions. Preserve labels separately.

The landing page does not establish exact per-record observation dates or a
complete label-verification procedure. Inspect the accompanying documentation
and introductory paper before claiming label quality. Do not treat the donation
date or our eventual download date as each URL's observation date.

## Alternatives considered

### PhishTank: potential later phishing-only check

Its [developer documentation](https://phishtank.org/developer_info.php) describes
hourly data containing community-verified, online phishing records, including
submission and verification dates and record IDs. It requests a descriptive
user agent and documents application-key limits.

Its [current terms page](https://phishtank.org/terms.php) directs readers to Cisco
terms and marks the older text archived. Do not assume the archived license text
alone authorizes a new integration; review the current linked terms if selected.

This feed alone cannot measure false-positive rate or precision across phishing
and legitimate samples. Its selection of currently online reports also limits
what a result says about other attacks. Keep it as a later independent check.

### OpenPhish: potential later source, with usage restrictions

The [academic program](https://openphish.com/academic_use.html) requires eligible
institutional affiliation and an application. It describes 60-day access and a
30-day archive, and restricts commercial use and third-party sharing.
The [general terms](https://www.openphish.com/terms.html) also distinguish research
from organizational/commercial uses and restrict redistribution.

Do not build an assumed unrestricted public dataset from this source. No account
application or contact has been made. Not selected for the initial baseline.

### Tranco: candidate discovery, not automatic legitimate labels

[Tranco](https://tranco-list.eu/) is a popularity ranking. The authors'
[research](https://arxiv.org/abs/1806.01156) explains the limitations and manipulation
risks of popularity rankings.

Do not turn every listed domain into a verified legitimate URL, or invent HTTPS
homepage URLs as a replacement for representative legitimate browsing examples.
That would bias comparisons against full phishing URLs. Independent label evidence
would still be needed. Distribution terms were not evaluated because this source
is not selected as our labeled baseline.

## Preparation before any real evaluation

1. Obtain the original source archive only when the dataset-download stage begins.
2. Record the source URL, retrieval time, archive SHA-256, citation, license, label
   mapping, and any verified collection-date information. Mark unknown dates unknown.
3. Inspect the actual CSV schema, label values, URLs, and source documentation.
   Use a proper CSV parser, including quoted fields; do not split lines on commas.
4. Preserve raw data separately from derived files. Keep dataset files out of Git.
5. Audit duplicates, conflicting labels, unsupported/invalid URLs, and class-specific
   URL patterns before interpreting performance.
6. Create reproducible development/holdout groups by registrable domain using a
   Public Suffix List implementation; group IP hosts exactly. Save split metadata.
7. Start with a small development-only run to verify import and reporting. Keep
   the holdout untouched until rules and threshold choices are frozen.

No measured accuracy, freshness guarantee, or deployment-readiness claim follows
from this source review. The recommendation is a project choice, not an endorsement
of the dataset's labels as error-free.
