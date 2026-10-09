# Diver

Diver is a Chrome extension I am developing as a student project. It checks website addresses, password forms, and public lists of reported phishing sites. When a warning rule matches, it opens a popup that explains the reason.

I wanted the warning to be easy to understand. Instead of only showing a score, Diver tells the user what it found, such as a password form using HTTP or a page matching a phishing report.

**Current version: 0.6.1.** The extension can run locally, but it is not published on the Chrome Web Store yet. It is still a work in progress, and its current detection coverage is limited.

## How it works

Diver uses three kinds of checks:

1. **Website address checks.** It looks for signals such as HTTP, an IP address in place of a domain name, or a very long address.
2. **Password form checks.** It reads the form's structure and declared destination. It does not read what the user types. It checks for problems such as a password form using GET, which can put submitted values in the URL.
3. **Reported-site checks.** It downloads public lists from MetaMask and malware-filter, then checks addresses against those lists on the user's device. This is called reputation checking.

Using my rules together with outside reputation data makes this a **hybrid** approach. It does not use machine learning.

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

[MetaMask's list](https://github.com/MetaMask/eth-phishing-detect) mainly covers Web3 phishing and scams. [malware-filter's list](https://gitlab.com/malware-filter/phishing-filter) adds general phishing reports. These are outside data sources, not lists I created myself.

Host checks require an exact hostname match. For example, a report for `example.test` does not automatically report every subdomain. Page checks can match a supported reported path without treating every page on the same service as reported. They use exact hosts and case-sensitive paths; unsupported patterns are skipped and counted.

Diver tries to refresh downloaded data after 12 hours when a check runs. It stops using a download after 24 hours. The malware-filter feeds must also have a publisher update time less than 24 hours old. A failed download is shown as unavailable, not safe. One matching source can still warn if another source fails. MetaMask's exceptions only affect its own list.

Dismissing a warning prevents repeated popups for that destination. A different path or query can warn without a page reload. Changing only a fragment, such as `#section`, does not reopen the warning.

## Privacy

Checks happen on the user's device. Diver does not read entered passwords, upload the addresses being checked, or save browsing-history logs. It downloads the public lists, so the download hosts can still receive normal request details such as the user's IP address. Requests omit cookies and referrer information.

Website access lets it inspect permitted pages and embedded frames. The `scripting` permission runs the form collector, `storage` saves list data, and `activeTab` supports checks opened by the user. Some page components called open shadow DOM can be inspected; closed ones cannot.

See the [privacy policy](PRIVACY.md) and the source license notices in `extension/vendor/`.

## Try it locally

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

## What the tests actually show

The latest historical comparison checked the address and reputation layers. It did not include page content, so it did not measure the password-form layer.

| Historical sample | Latest warnings |
| --- | ---: |
| 78,827 phishing-labeled URLs | 1,890 |
| 107,859 legitimate-labeled URLs | 0 |
| Separate sample of 4,636 valid legitimate-labeled URLs | 0 |

That is about **2.40% of the phishing labels detected** in that development set. It is low, and it is not the extension's overall accuracy. The labels are historical, their current status was not independently checked, and overlap with the public lists is unknown. Zero warnings in the legitimate samples does not mean Diver will never give a wrong warning.

The earlier address-only experiment caught 524 of 78,827 phishing labels at a score threshold of 30. That is a different setting from the automatic warning threshold of 60, so these counts should not be treated as a direct before-and-after comparison.

Code tests and harmless Chrome fixtures passed, including redirects, changing addresses without reloading, and repeat-warning prevention. No live malicious page was opened in these checks. Live testing in a separate VM is still pending. Diver cannot yet be described as dependable protection against phishing in general.

## What I can explain in an interview

The main parts are the address rules, form collector, form analyzer, list matching, and automatic warning flow. I can explain why checks stay local, why a page report should not flag a whole hosting service, and why a dismissed warning must not silence a different destination.

The [interview guide](docs/interview-guide.md) gives short explanations, example answers, and a map of the code. Detailed evidence is in the [list checkpoint](docs/two-source-checkpoint.md), [page checkpoint](docs/page-reputation-checkpoint.md), and [navigation checkpoint](docs/navigation-warning-checkpoint.md).

## Release and support

Run `npm run package:extension` on Windows to build the upload package. It includes extension files and license notices, not the research datasets or test pages. See the [publication checklist](docs/public-release.md).

Project: [AxelMagcamit/Diver](https://github.com/AxelMagcamit/Diver). Questions and bugs: [GitHub Issues](https://github.com/AxelMagcamit/Diver/issues). Do not include passwords or private links in public reports.
