# Diver

Diver is a Manifest V3 Chrome extension that gives explainable phishing-risk and credential-handling warnings. It combines local URL and password-form checks with an exact-hostname lookup against a downloaded third-party reputation list.

**Release status:** version 0.4.0 is a release candidate. Chrome Web Store publication is pending. The [release review](docs/release-review.md) found limited URL/reputation coverage on historical development data; broad phishing-protection claims are not supported. It is not a guarantee of protection against phishing or malware.

## What it does

- Checks URLs for HTTP, IPv4 hostnames, Punycode labels, embedded user information, and long URLs.
- Inspects declared password-form actions and submit-button overrides in accessible HTTP/HTTPS documents, including embedded frames and open shadow DOM.
- Reports GET password submissions, HTTP password pages, HTTP form destinations, and cross-site destinations.
- Matches the top page's exact hostname against MetaMask's public `eth-phishing-detect` list. This source focuses on Web3 phishing and scams.
- Opens its popup when a warning rule matches in the visible tab. Repeated scans do not reopen a dismissed warning during the same top-document visit.

Warnings appear after page inspection. Diver does not prevent navigation, block requests, submit forms, or observe actual credential transmissions. Closed shadow DOM, JavaScript submissions, restricted documents, and non-HTTP/HTTPS frame documents remain outside inspection.

## How the hybrid detector works

```text
Page navigation / relevant form change
                 |
       URL and form inspection
                 |
     Local hostname reputation lookup
                 |
         Shared warning policy
                 |
  Visible tab -> attributed warning popup
```

The URL score is the sum of five provisional rule weights, capped at 100. It is not a probability. Form findings and reputation results are separate evidence and do not change that score.

| URL rule | Signal | Points |
| --- | --- | ---: |
| URL-001 | HTTP | 10 |
| URL-002 | IPv4 hostname | 20 |
| URL-003 | Punycode label | 20 |
| URL-004 | User information in URL | 20 |
| URL-005 | URL longer than 150 characters | 10 |

Automatic warnings cover a URL score of at least 60, GET credential exposure, HTTP password pages, eligible password fields declaring HTTP submission, the existing cross-site HTTP condition, or an exact reputation-list match. These rules indicate reported threats or declared risks; they do not prove phishing.

## Reputation data and limitations

[MetaMask eth-phishing-detect](https://github.com/MetaMask/eth-phishing-detect) supplies the external data. Diver implements its own exact membership checks rather than reproducing the source detector's fuzzy matching.

- Matching uses normalized exact hostnames, not substring matches or parent-domain expansion.
- Path-specific source entries are omitted rather than turning a reported page into a report against its entire host.
- An exact allowlist exception affects only reputation matching; Diver's own rule findings remain available.
- A snapshot refresh is requested after 12 hours, when a supported URL check runs.
- A failed refresh can retain a snapshot younger than 24 hours. Older data produces `unavailable`, not a safe verdict.
- Download time is not the date a reported threat was independently verified.
- An unlisted hostname can still be malicious. A listed hostname can be reported incorrectly or later removed.

The repository preserves the source's original license in `extension/vendor/eth-phishing-detect-LICENSE`, alongside the tldts licenses. Source data is attributed separately from Diver's implementation.

## Privacy and permissions

Diver reads page URLs and password-form structure locally. It does not read entered passwords or field values, upload browsing URLs/form snapshots, or maintain browsing-history logs.

It downloads the public domain-list data from GitHub. GitHub can receive ordinary request metadata, such as IP address and browser user-agent; downloaded-list requests omit credentials and referrer information.

- HTTP/HTTPS host access permits automatic page and frame inspection.
- `scripting` runs the collector in isolated document contexts.
- `storage` caches provider list data and its download timestamp.
- `activeTab` supports user-invoked access where Chrome permits it.

The ocean-motion preference is stored locally. See [PRIVACY.md](PRIVACY.md) for the full policy, also available inside the extension.

## Run locally

1. Open `chrome://extensions` in Chrome 127 or newer.
2. Enable Developer mode and choose **Load unpacked**.
3. Select this repository's `extension` directory.
4. Grant the required site access. Refresh previously open tabs after reloading the extension.
5. Use the popup to inspect findings. Automatic warnings occur only when a warning rule matches in the active, focused tab.

The extension runs without a backend, API key, or npm installation. The first reputation download can take up to 15 seconds. Local rule warnings do not wait for it.

## Development and checks

```powershell
npm ci
npm test
```

The Node suite covers URL rules, form analysis, domain identity, reputation matching/cache failures, and evaluation utilities. Browser release checks separately exercise real extension APIs and popup behavior. Passing functional tests does not measure detection accuracy.

For controlled local form fixtures:

```powershell
node evaluation/node/serve-form-tests.js
```

Open `http://127.0.0.1:8765/credential-demo`. Leave fields empty and do not submit credentials. HTTP fixtures intentionally trigger transport warnings.

## Evaluation evidence

The historical URL-only development baseline at threshold 30 detected 524 of 78,827 phishing-labeled URLs: recall 0.66%. Source sampling limitations and the full results are documented in [docs/development-baseline.md](docs/development-baseline.md).

That baseline predates the form and reputation layers and does not measure this hybrid release. No overall accuracy percentage is claimed for version 0.4.0. Historical datasets, synthetic fixtures, and functional tests must not be presented as evidence of current real-world protection.

Evaluation commands and experiment decisions remain in `docs/` and `evaluation/node/`. Keep the final holdout separate from detector development.

## Release and support

The Windows packaging command is `npm run package:extension`. It includes runtime files and notices, and excludes datasets, development fixtures, tests, and source maps. A publication checklist is in [docs/public-release.md](docs/public-release.md).

Project: [AxelMagcamit/Diver](https://github.com/AxelMagcamit/Diver). Report bugs or ask for support through [GitHub Issues](https://github.com/AxelMagcamit/Diver/issues). Do not include passwords, private URLs, or authentication tokens in public reports.

Privacy policy: [PRIVACY.md](PRIVACY.md). Version 0.4.0 remains an unpublished release candidate until Chrome Web Store review and publication.
