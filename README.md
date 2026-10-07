# Diver

Diver is a Chrome extension that checks URLs for suspicious structural
signals. Its popup and Node.js evaluation runner share the same
JavaScript detection engine.

## Current rules

| Rule | Signal | Score |
|---|---|---:|
| URL-001 | HTTP instead of HTTPS | 10 |
| URL-002 | IPv4 address used as hostname | 20 |
| URL-003 | Punycode domain label | 20 |
| URL-004 | User information embedded in the URL | 20 |
| URL-005 | Parsed URL longer than 150 characters | 10 |

Matching scores are added together and capped at 100.

These scores are provisional. A matching signal does not prove phishing,
and a score of zero does not guarantee safety.

## Load the Chrome extension

1. Open chrome://extensions/ in Chrome.
2. Enable Developer mode.
3. Click Load unpacked.
4. Select this project's extension folder.
5. Open a webpage and click the Diver extension icon.

After editing extension files, reload Diver on the extensions page.

## Run the tests

Install Node.js, then open a terminal in the project root:

```powershell
npm test
```

This command runs 22 engine cases covering the five rules, combined scores,
invalid input, URL-length boundaries, and unsupported protocols, followed by
10 metrics tests covering known counts, empty inputs, and undefined rates,
and 9 labeled-workflow tests.

You can also run each group separately:

```powershell
npm run test:engine
npm run test:metrics
npm run test:labeled
```

No additional npm packages are required.

## Run the default evaluation

From the project root, run:

```powershell
npm run evaluate
```

The default input file is:

evaluation/node/sample-urls.json

## Evaluate a different input file

Supply a JSON file containing an array of URL strings:

```powershell
npm run evaluate -- evaluation/node/extra-urls.json
```

Relative input paths are resolved from the terminal's current folder.
For paths containing spaces, wrap the path in double quotes.

The runner analyzes URL strings without visiting websites.

## Evaluation report

The runner displays a table and saves the full results to:

evaluation/results/latest-report.json

The report includes the generation time, input file path, summary,
and full analysis results.

Each successful run replaces the previous latest report.
Generated reports are ignored by Git.

In the table, Valid means the engine could parse the URL. Supported means
it uses HTTP or HTTPS and can be analyzed. Neither means the website is safe.

Invalid and unsupported inputs display N/A and store a null score in JSON.
Unsupported URLs remain valid URLs, but have supported set to false and no findings.
The summary separates supported URLs, unsupported URLs, and invalid inputs.

Run the mixed-protocol example with:

```powershell
npm run evaluate -- evaluation/node/protocol-urls.json
```

The popup and evaluator both use the shared engine's support decision.

## Project structure

- extension/engine/ — shared detection engine and rules
- extension/popup/ — Chrome popup interface
- evaluation/node/ — tests, sample inputs, and evaluation runner
- evaluation/results/ — generated reports

## Current limitations

The sample evaluation checks engine behavior; it does not measure
phishing detection accuracy. No labeled dataset evaluation has been
performed yet.

## Synthetic metrics demonstration

```powershell
npm run demo:metrics
```

This demonstrates precision, recall, false-positive rate, F1, and accuracy using
invented outcome counts. It does not analyze URLs, run the detection engine,
write an evaluation report, or measure Diver's phishing detection accuracy.

The calculator is in evaluation/node/metrics.js. Supply non-negative integer
counts named tp, fp, fn, and tn. It returns unrounded rates from 0 to 1 and null
when a denominator is zero. The demo formats rates as percentages and null as N/A.
Only independently labeled, eligible results should feed a future real evaluation;
coverage, exclusion counts, and threshold metadata belong in that future runner.
See docs/evaluation-plan.md for the evaluation protocol.

## Synthetic labeled workflow

```powershell
npm run demo:labeled
```

This runs the shared engine on example URLs paired with deliberately invented
labels, applies the default threshold of 30, and calculates outcome counts and
metrics. It verifies the workflow, not real phishing accuracy. No websites are
visited or datasets downloaded. The fixture is in
evaluation/node/fixtures/synthetic-labeled.json.

At threshold 30 it has 13 input records, 6 evaluated records, and 7 exclusions.
Expected counts: TP=2, FP=1, FN=1, TN=2. These are synthetic demonstration results.

An optional integer threshold from 0 to 100 changes this demo only:

```powershell
npm run demo:labeled -- 40
```

Results are saved separately to evaluation/results/synthetic-labeled-report.json,
marked synthetic. Each successful demo run replaces that synthetic report; the
ordinary latest-report.json is untouched.

The reusable evaluator accepts records with URL strings and labels. Only exact
lowercase phishing and legitimate labels are recognized. Missing or other string
labels are excluded. It preserves the original URL and any extra record metadata.
Conflicting known labels quarantine all records for that exact URL. Otherwise,
exact URL duplicates are removed, preferring a known label over an unknown label.
Each remaining record is checked for invalid URL, unsupported protocol, then
unknown label, in that order. Every input belongs to one outcome or one exclusion.
Unexpected engine errors stop evaluation.

This synthetic demo does not implement source provenance validation or dataset
splitting. Those are required before a real quality evaluation, as described in
docs/evaluation-plan.md.
