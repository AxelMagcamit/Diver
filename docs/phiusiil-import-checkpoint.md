# PhiUSIIL import checkpoint

The original [UCI dataset](https://archive.ics.uci.edu/dataset/967/phiusil-phishing-url-dataset) was downloaded and imported locally.

- Retrieval timestamp (UTC): 2026-10-07T10:28:34.7707229Z
- Total records: 235795
- Source labels: 100945 phishing; 134850 legitimate
- Label mapping: 0 = phishing; 1 = legitimate
- Unique exact URL strings: 235370
- Extra duplicate records: 425
- Conflicting exact URL groups: 0
- Syntactically invalid URLs: 0
- Unsupported protocol URLs: 0
- Supported HTTP/HTTPS URLs: 235795
- Duplicate source record IDs: 0

## Reproducibility

Archive SHA-256: 0a639fd03aea6308c5b1c10c92aa23c2ce1505447a9137271865cd0badc9a59a

CSV SHA-256: a236549cd369cd80bd478ff8e1779cbf44c58d5c3f79f7a51a1adbed7d06d1c6

The hashes fingerprint this download; they are not independently published UCI signatures.

Local files (ignored by Git):

- datasets/raw/phiusiil-original.zip
- datasets/raw/PhiUSIIL_Phishing_URL_Dataset.csv
- datasets/raw/phiusiil-source.json
- datasets/processed/phiusiil.json
- datasets/processed/phiusiil-import-audit.json

The processed records preserve original URL strings and source IDs and omit engineered
features. No URLs were visited. No scores or accuracy metrics were computed.
No train/development/holdout split has been made.

## Attribution and limitations

Prasad, A. & Chandra, S. (2024). PhiUSIIL Phishing URL (Website) [Dataset]. UCI Machine Learning Repository. https://doi.org/10.1016/j.cose.2023.103545.

Licensed under [CC BY 4.0](https://creativecommons.org/licenses/by/4.0/).
Changes: CSV was converted to JSON; engineered feature columns were excluded;
numeric labels were mapped to text; provenance and row identifiers were added.

Per-record observation dates remain unknown. The download date is not the label date.
Source labels have not been independently reverified. These structural checks do not
establish label correctness, campaign independence, URL-equivalent duplication, or
current real-world detection performance.

Next: create reproducible registrable-domain-separated development and holdout files,
record the grouping method and split seed, and keep the holdout untouched while
developing rules. Audit URL-equivalent variants and source biases before interpretation.
