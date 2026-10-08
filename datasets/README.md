# Local data workflow

No real dataset has been downloaded. The importer has been tested with invented CSV.

- raw/: original archives, extracted CSV, and source metadata. Ignored by Git.
- processed/: derived JSON. Ignored by Git.
- Synthetic fixtures live under evaluation/node/fixtures and are tracked.

## Try the synthetic importer

Run npm run demo:import. Expected: 3 records, 1 phishing label, 2 legitimate labels.
Those labels are invented. Invalid URL strings are retained for the evaluator to exclude.

## Future real import

First obtain the original dataset and record its source details. Do not run this
example until the files exist. Paths are relative to the terminal's current folder:

    npm run import:phiusiil -- datasets/raw/PhiUSIIL_Phishing_URL_Dataset.csv datasets/raw/phiusiil-source.json datasets/processed/phiusiil.json

The output folder must exist. The importer refuses to overwrite any existing output.
It reads locally, computes no scores, and does not visit URLs. A successful import
is not label validation or a quality evaluation.

The source JSON must contain:

- kind: dataset for an actual source, synthetic for an invented fixture.
- sourceName: the provider/dataset name.
- sourceUrl: the original dataset reference URL.
- license: the applicable license and attribution reference.
- csvSha256: the 64-character SHA-256 digest of the original extracted CSV.
- retrievedAt: an ISO timestamp for retrieval (required for real datasets).
- observedAt: a documented common observation timestamp, or null if unknown.

Also preserve the downloaded archive hash, archive URL, citation, and collection
notes as extra metadata fields; these are retained in the output. Metadata is a
user-supplied provenance record, not independent proof of label quality or origin.
The CSV checksum verifies bytes against that record, not source authenticity.

The required headers are exactly URL and label. Optional FILENAME supplies source
record IDs; otherwise data-record numbers are used. Only label 0 maps to phishing
and label 1 maps to legitimate. Unknown values, duplicate headers, malformed CSV,
empty inputs, and checksum mismatches fail the import. URL text is not trimmed,
normalized, or scored. Duplicates and contradictory labels stay in the import for
the later evaluator's audit. Extra feature columns are ignored.

Records and the final JSON are held in memory, although CSV input parsing streams.
This importer is not intended for arbitrarily large datasets.

Before reporting real accuracy: inspect the source schema and label provenance,
audit exclusions and class patterns, and create reproducible domain-separated
development and holdout splits. See docs/evaluation-plan.md and
docs/data-source-review.md. No splitting is performed by this importer.

The separate `npm run split:dataset -- input.json new-output-directory` command
now creates reproducible development and holdout files. The destination's parent
directory must exist. Exact URL duplicates are excluded; contradictory known
labels are quarantined. Registrable domains use tldts with private suffixes
enabled; canonical IP addresses and hostname fallbacks form their own groups.
The manifest preserves source provenance, hashes, settings and exclusion counts.
All generated dataset files remain local under datasets/processed/ and ignored
by Git. See docs/phiusiil-split-checkpoint.md. Holdout is reserved for final testing.
