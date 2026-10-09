# Diver

Diver is a Chrome extension that checks website addresses, password forms, and public reports of phishing sites. When a warning rule matches, it opens a popup explaining the finding.

Each warning includes a reason, such as a password form using HTTP or a page matching a phishing report. The aim is to give users enough information to understand the risk.

**Current version: 0.6.1.** The extension can run locally, but it is not published on the Chrome Web Store yet. It is still a work in progress, and its current detection coverage is limited.

## How it works

Diver uses three kinds of checks:

1. **Website address checks.** It looks for signals such as HTTP, an IP address in place of a domain name, or a very long address.
2. **Password form checks.** It reads the form's structure and declared destination. It does not read what the user types. It checks for problems such as a password form using GET, which can put submitted values in the URL.
3. **Reported-site checks.** It downloads public lists from MetaMask and malware-filter, then checks addresses against those lists on the user's device. This is called reputation checking.

Combining local rules with external reputation data makes this a **hybrid** approach. The current version does not use machine learning.

```text
Open a page or change its address
               |
Check the address and password forms
               |
Compare the address with downloaded reports
               |
If a warning rule matches, explain it in a popup
```

The popup can also be opened manually. Automatic warnings apply to the active tab in the focused browser window. They appear after inspection; Diver does not stop the page from loading.

## The score and warning rules

The score only comes from website address rules. Form findings and reputation matches are shown separately.

| Address signal | Points |
| --- | ---: |
| HTTP instead of HTTPS | 10 |
| IPv4 address instead of a domain name | 20 |
| Punycode label, which is an encoded international domain name | 20 |
| User information included before the hostname | 20 |
| Address longer than 150 characters | 10 |

These are starting weights, not proven probabilities. A score of 60 does **not** mean a 60% chance of phishing. Some legitimate sites can have these signals too. The popup labels a score of 30 or more as suspicious; an automatic address-rule warning needs 60 or more.

Other automatic warning reasons include a reported host/page match, a password field on an HTTP page, a form declaring GET submission, or a qualifying HTTP password destination. A form going to another site is shown as a finding, but that alone is not enough to declare phishing: legitimate sign-in services can do this too.

## Why the reported-site checks are careful

[MetaMask's list](https://github.com/MetaMask/eth-phishing-detect) mainly covers Web3 phishing and scams. [malware-filter's list](https://gitlab.com/malware-filter/phishing-filter) adds general phishing reports. Diver uses these external reports and identifies their sources in the popup.

Host checks require an exact hostname match. For example, a report for `example.test` does not automatically report every subdomain. Page checks can match a supported reported path without treating every page on the same service as reported. They use exact hosts and case-sensitive paths; unsupported patterns are skipped and counted.

Diver tries to refresh downloaded data after 12 hours when a check runs. It stops using a download after 24 hours. The malware-filter feeds must also have a publisher update time less than 24 hours old. A failed download is shown as unavailable, not safe. One matching source can still warn if another source fails. MetaMask's exceptions only affect its own list.

Dismissing a warning prevents repeated popups for that destination. A different path or query can warn without a page reload. Changing only a fragment, such as `#section`, does not reopen the warning.

## Privacy

Checks happen on the user's device. Diver does not read entered passwords, upload the addresses being checked, or save browsing-history logs. It downloads the public lists, so the download hosts can still receive normal request details such as the user's IP address. Requests omit cookies and referrer information.

Website access lets it inspect permitted pages and embedded frames. The `scripting` permission runs the form collector, `storage` saves list data, and `activeTab` supports checks opened by the user. Some page components called open shadow DOM can be inspected; closed ones cannot.

See the [privacy policy](PRIVACY.md) and the source license notices in `extension/vendor/`.

## Installation

1. Use Chrome 127 or newer and open `chrome://extensions`.
2. Turn on **Developer mode**.
3. Click **Load unpacked** and select the `extension` folder.
4. Allow the needed website access and refresh your tabs.
5. Click Diver's icon to view the checks.

No backend, API key, or npm installation is needed to run the extension. List downloads start on first use, with a 15-second timeout per feed. Local rule warnings do not wait for those downloads.

For development tests:

```powershell
npm ci
npm test
```

For harmless local password-form examples:

```powershell
node evaluation/node/serve-form-tests.js
```

Open `http://127.0.0.1:8765/credential-demo`. Leave fields empty. The HTTP examples are meant to trigger warnings; no form submission is needed.

## Evaluation results

The latest historical comparison checked the address and reputation layers. It did not include page content, so it did not measure the password-form layer.

| Historical sample | Latest warnings |
| --- | ---: |
| 78,827 phishing-labeled URLs | 1,890 |
| 107,859 legitimate-labeled URLs | 0 |
| Separate sample of 4,636 valid legitimate-labeled URLs | 0 |

The address and reputation checks detected about **2.40% of the phishing labels** in that development set. This remains limited coverage and does not represent the extension's overall accuracy. The labels are historical, their current status was not independently checked, and overlap with the public lists is unknown. Zero warnings in these legitimate samples does not guarantee zero future false alarms.

The earlier address-only experiment caught 524 of 78,827 phishing labels at a score threshold of 30. That is a different setting from the automatic warning threshold of 60, so these counts should not be treated as a direct before-and-after comparison.

Code tests and controlled Chrome checks passed, including redirects, address changes without reloading, and repeat-warning prevention. No live malicious page was opened in those checks. VM testing is the next checkpoint; its [results report](docs/testing/vm-test-results.md) remains pending. Current evidence does not establish dependable protection against phishing in general.

## Project decisions

The main parts are the address rules, form collector, form analyzer, list matching, and automatic warning flow. Checks stay local to avoid uploading browsing addresses. Page reports are kept separate from whole-host reports, and closing a warning does not silence a different reported destination.

Detailed evidence is in the [list checkpoint](docs/checkpoints/two-source-checkpoint.md), [page checkpoint](docs/checkpoints/page-reputation-checkpoint.md), and [navigation checkpoint](docs/checkpoints/navigation-warning-checkpoint.md).

## Release and support

Run `npm run package:extension` on Windows to build the upload package. It includes extension files and license notices, not the research datasets or test pages. See the [publication checklist](docs/release/public-release.md).

Project: [AxelMagcamit/Diver](https://github.com/AxelMagcamit/Diver). Questions and bugs: [GitHub Issues](https://github.com/AxelMagcamit/Diver/issues). Do not include passwords or private links in public reports.

## Repository layout

| Location | Contents |
| --- | --- |
| `extension/` | Chrome extension files, popup, detection rules, and source notices |
| `evaluation/node/` | Code tests and offline evaluation tools |
| `evaluation/browser/` | Browser checks using harmless local pages |
| `datasets/` | Dataset guidance; raw downloads and processed data stay local |
| `docs/checkpoints/` | Recorded evidence for completed features |
| `docs/testing/` | VM test plan and results report |
| `docs/release/` | Publication checklist and draft Store description |
| `docs/archive/` | Earlier research and experiments, preserved for reference |
| `scripts/` | Packaging and documentation checks |

Start with the [documentation index](docs/README.md). After VM testing, update the results report, record any fixes, and review the release checklist. Run `npm run check:docs` to check local document links and confirm preparation notes are not included in tracked documentation.
