# Publishing Diver

Version 0.6.1 runs locally, but Chrome Web Store publication is still pending. Diver is a tool that explains possible risks; it does not block navigation or guarantee protection.

## What is working

The extension checks addresses, password-form structure, reported hostnames, and supported reported page patterns. It can inspect accessible embedded frames and open shadow DOM, which are page components Chrome allows the collector to read.

The code tests passed. Isolated Chrome checks also passed for real popups, form warnings, redirects, and address changes without reloading. Closing a warning prevents repeat popups for that destination while still allowing a different reported destination to warn.

Those browser examples used harmless local pages and test entries. Passing them shows that the feature works as intended; it does not establish real-world phishing accuracy. Live malicious-page testing in the VM is still pending.

## What remains before publication

1. Check that the [repository](https://github.com/AxelMagcamit/Diver), [support page](https://github.com/AxelMagcamit/Diver/issues), and [privacy policy](https://github.com/AxelMagcamit/Diver/blob/main/PRIVACY.md) are publicly readable.
2. Register or sign in to the Chrome Web Store developer dashboard. The account and any registration payment need the owner's action.
3. Finish the remaining evaluation and review the known limitations. Do not advertise general protection that the results do not support.
4. Prepare screenshots and an accurate description of what the extension does.
5. Explain the permissions and data handling: local address/form inspection, public-list downloads, and local storage. Add the public privacy-policy link.
6. Run `npm run package:extension`, check the packaged files, and submit the package for review.

Building a ZIP or pushing to GitHub is not the same as publishing on the Store. Publication depends on Google's review.

## Draft listing text

**Name:** Diver — Phishing-risk warnings

**Summary:** Check website addresses and password forms, compare public phishing reports locally, and see why a warning appears.

**Description:** Diver checks website addresses and password-form settings for possible risks. It can warn about password forms using GET, HTTP password pages or destinations, and supported matches in public phishing reports. It also shows findings when a form declares a destination on another site.

The extension downloads lists from MetaMask and malware-filter, then checks them on your device. It uses exact hostnames and a limited set of page patterns. Selected warning reasons open a popup in the active browser tab.

Diver does not read entered passwords, upload browsing addresses, or keep browsing-history logs. The public-list downloads come from GitHub and GitLab Pages; their hosts can receive normal download information such as your IP address. The downloaded list data is stored locally.

Diver does not stop a page from loading or prove that a site is safe. It can miss unlisted threats, restricted page content, and submissions handled by JavaScript. Closed shadow DOM and non-HTTP/HTTPS documents are not inspected. Reports and rules can also produce mistaken warnings. The score is a total of address-rule points, not a probability.

Do not claim a measured overall accuracy percentage, zero false alarms, protection against all malware, or endorsement by Google or MetaMask.

## Harmless reviewer checks

Load the package and open a normal HTTPS website. Click Diver's icon to see address and list results. For local form examples, start the repository's form-test server and open `/credential-demo`. Leave fields empty; no submission is needed. The HTTP examples intentionally produce warnings.

Lists download on first use. A failed source is shown as unavailable. No extension account or API key is required.

## Reference pages

- [Chrome's publication guide](https://developer.chrome.com/docs/webstore/publish)
- [Chrome's privacy policies](https://developer.chrome.com/docs/webstore/program-policies/privacy)
- [Current page-check evidence](page-reputation-checkpoint.md)
- [Warning delivery fix](navigation-warning-checkpoint.md)
- [Earlier two-list comparison](two-source-checkpoint.md)
- [Interview guide](interview-guide.md)

The earlier 0.4.0 review is kept as historical evidence. It is not a certification of the current version.
