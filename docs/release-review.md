# Release review — 9 October 2026

Version reviewed: 0.4.0. **Decision: do not submit as broad phishing protection yet.** The implementation is a working release candidate; evidence does not establish dependable general phishing coverage.

## Functional and privacy review

- The upload package includes 24 runtime files, a root manifest, privacy page and provider licenses. ZIP entry separators are compatible with extension paths. Tests, datasets, source maps and development tooling are excluded.
- Chrome for Testing loaded the packaged extension using real extension APIs. Controlled `.test` pages exercised source-attributed automatic warnings, dismissal suppression and a cross-origin frame GET warning. These checks are behavioral evidence, not detection accuracy.
- Broad HTTP/HTTPS access is used for automatic page/frame inspection; scripting runs isolated collectors; storage caches the list; activeTab supports manual inspection. No additional permissions were added during this review.
- The only application fetch is the fixed public reputation configuration. Entered field values are not read. Results are rendered using textContent rather than treating page data as HTML. Browsing URLs/form snapshots are not sent to the provider.
- Public privacy and support pages are available. The Store privacy field and declarations still need to be completed. This is a code review, not a guarantee of Store approval or a complete security audit.

## Offline effectiveness check

The exact runtime URL analyzer, reputation module and warning policy were evaluated with a pinned provider snapshot. The Node driver substitutes a local snapshot for fetch and in-memory storage for Chrome storage. It performs no page navigation or external lookups for dataset URLs. Password-form analysis is absent because the input datasets contain URLs only.

| Development sample | Evaluated | Reputation alerts | Automatic URL alerts at 60 | Combined automatic alerts |
| --- | ---: | ---: | ---: | ---: |
| PhiUSIIL phishing-labeled URLs | 78,827 | 18 | 0 | 18 |
| PhiUSIIL legitimate-labeled URLs | 107,859 | 0 | 0 | 0 |
| PhreshPhish legitimate pilot URLs | 4,636 | 0 | 0 | 0 |

For the phishing-labeled subset, combined URL/reputation recall was **0.0228%** (18 / 78,827). The manual popup's score >=30 category flagged 524 phishing-labeled URLs (0.6647%), with no legitimate flags in the PhiUSIIL sample; that category does not automatically open a warning.

The PhreshPhish input contained 4,704 records; 68 invalid URLs were excluded. The samples are reported separately, not pooled. The development checksums matched their existing manifests; no holdout was read and no rules or thresholds were tuned.

These are historical development results, not current overall hybrid accuracy. Labels were not independently reverified. A current Web3-focused feed and an older general phishing dataset have different coverage and timing. Provider/dataset overlap is unknown. Zero observed false alerts does not establish zero future false positives. Form findings cannot be credited as detections without page evidence.

Provider revision: `0f8d59531594ae53e437497e6cd07a4b05fb25a6`.

Provider configuration SHA-256: `66640950171514caa26cf3d525ac7b28405cc93a00130891307d16bc8745c86d`.

Development input SHA-256: `93243918ce1c21aab337b14bc9322471a679abdc2c6f0935f99fb8ea649a4228`.

Benign pilot SHA-256: `abdcd5fed213b194be0d7ad72eaa49bc0a55cc754b44906b4292d3801739690d`.

Reports are stored under the ignored evaluation/results directory and include input, manifest and implementation hashes. Reports exclude raw page URLs and record-level outputs.

## Known behavior boundaries

Warnings open after inspection in the active, focused tab. They do not block navigation or prevent the page from running. If top-document injection fails, automatic scanning stops; the manually opened popup can still show URL/reputation results where Chrome provides the tab URL. Access restrictions can suppress automatic protection.

Reputation checks cover only the top hostname, use exact matches, and omit ancestor-domain expansion and path-specific entries. Closed shadow DOM, non-web frames and actual JavaScript submissions are not inspected. The presence of a declared risky form does not prove actual credential transmission or phishing.

## Remaining release gate

Choose and validate broader threat coverage before claiming general phishing detection, or explicitly limit the first release to credential-handling and Web3 reputation warnings. Any added source needs a license/use review, privacy review, independent labeled evaluation and failure-handling checks. Do not claim a measured hybrid accuracy percentage from these URL-only development results.

The account registration, Store listing/screenshots, privacy declarations and Google review remain unfinished. No Chrome Web Store submission was performed.

## Reproduce the offline check

Use the existing development inputs and manifests documented in development-baseline.md and benign-multishard-results.md. Save the pinned public source snapshot and its metadata locally; neither is bundled into the extension.

```powershell
New-Item -ItemType Directory -Path evaluation/results -Force
Invoke-WebRequest -Uri 'https://raw.githubusercontent.com/MetaMask/eth-phishing-detect/0f8d59531594ae53e437497e6cd07a4b05fb25a6/src/config.json' -OutFile evaluation/results/provider-feed.json
[System.IO.File]::WriteAllText((Join-Path $PWD 'evaluation/results/provider-source.json'), '{"revision":"0f8d59531594ae53e437497e6cd07a4b05fb25a6","sourceUrl":"https://raw.githubusercontent.com/MetaMask/eth-phishing-detect/0f8d59531594ae53e437497e6cd07a4b05fb25a6/src/config.json","retrievedAt":"2026-10-09T15:22:55.9399952Z"}')
npm run evaluate:release -- evaluation/results/provider-feed.json evaluation/results/provider-source.json
```

The recorded retrievedAt value identifies the original check; change it to the actual UTC retrieval time when downloading a new local copy. The provider revision and content hash should match this review.
