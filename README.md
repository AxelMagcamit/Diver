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

The current test set contains 22 cases covering the five rules,
combined scores, invalid input, URL-length boundaries, and unsupported protocols.

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