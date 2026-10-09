# PhreshPhish URL-only pilot — 8 October 2026

Prepared 500 source-labeled benign URLs for a separate exploratory development
audit. No Diver scores were computed and no test/holdout partition was read.

- Official repository: https://huggingface.co/datasets/phreshphish/phreshphish
- Revision: eabec4b7a66324b79cc8a0ad856d1731dc26fe1a
- Training shard: data/train-000.parquet (49,639,686 bytes, 1,000 rows).
- The shard has 594 benign and 406 phish records. Only benign records were selected.
- Selection: take at most the first 2,000 rows of this shard (all 1,000 here),
  retain benign labels, then select the 500 lowest SHA-256 ranks using seed
  diver-phreshphish-pilot-v1. This is not a random sample of the whole dataset.
- Requested columns: sha256, url, label, date. The date column is Parquet DATE;
  decoded dates are retained without treating them as independently verified
  label timestamps. Source benign maps to legitimate; URLs are not rewritten.
- Refined extraction transferred 71,532 bytes using exact footer and column
  ranges. No HTML column was decoded or rendered. An initial reader probe used
  its default 512 KiB tail request (594,159 bytes total); the saved refined
  retrieval avoids that oversized tail. No dataset URLs were visited.
- Publisher's full-file SHA-256 is recorded but not independently verified
  because the complete file was not downloaded. Each retrieved byte range and
  the derived JSON have separately computed SHA-256 hashes.

The local raw bundle is datasets/raw/phreshphish-pilot-v1/. It contains the
retrieved ranges, manifest and extracted pilot. The working copy is
datasets/processed/phreshphish-benign-pilot-v1.json. Both locations are Git-ignored.
The manifest retains source revision, labels, dates, seed, byte counts and hashes.

The reproduction tool has isolated pinned dependencies in
evaluation/tools/phreshphish/. To rerun from the project root:

```powershell
npm ci --prefix evaluation/tools/phreshphish --ignore-scripts
node evaluation/tools/phreshphish/prepare-sample.mjs
```

It writes a new ignored sample-url-only/ folder beside the script and refuses
to overwrite an existing retrieval. It requires public network access and fails
if a server ignores requested byte ranges or a 20 MB requested-byte cap is
exceeded. It does not change extension dependencies or behavior.

Attribution: Dalton et al., PhreshPhish (2025), arXiv:2507.10854.
The repository declares CC BY 4.0 and requests anti-phishing research use.
Original paper: https://arxiv.org/html/2507.10854v1

Limitations: a single shard may have ordering or source bias; the paper describes
removal of benign query parameters; source labels are not independently verified.
This benign-only pilot cannot measure precision or recall. Next audit URL shapes,
duplicate/domain concentration and development overlap before reporting false
alerts. Keep any results separate from PhiUSIIL and final holdout performance.
