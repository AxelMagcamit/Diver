# Diver public MVP release checkpoint

## Scope frozen for version 0.4.0

URL structure checks, declared password-form handling, accessible frames/open shadow DOM, exact top-hostname reputation checks, and selective automatic warning popups. This is an explainable risk-warning tool. It does not block navigation or guarantee protection.

## Completed behavior checks

- Existing Node suite passed after the hybrid code was applied.
- Real Chrome for Testing loaded the actual extension service worker.
- A synthetic listed `.test` hostname opened the actual action popup and rendered source attribution.
- Dismissing the popup suppressed repeat warnings on the same top document.
- A routed cross-origin iframe triggered the GET warning with its frame context.
- Reputation checks exercised boundaries, allowlist precedence, malformed updates, retry backoff, expiry, and privacy of download requests.

Synthetic domains were served as local test responses. No live malicious website was visited. Functional checks do not establish phishing detection accuracy. Browser checks used an isolated profile.

## Required before submission

1. Repository/support links are configured: https://github.com/AxelMagcamit/Diver and https://github.com/AxelMagcamit/Diver/issues. Upload the reviewed source and confirm these pages are accessible.
2. After uploading the code, verify https://github.com/AxelMagcamit/Diver/blob/main/PRIVACY.md is publicly readable. Supply that public policy URL in the Store privacy field.
3. Register/sign in to the Chrome Web Store developer dashboard. Account registration and any fee require the user's own account action.
4. Prepare screenshots and listing text that accurately describe the scope and limitations. Do not claim protection against all malware, a measured hybrid accuracy percentage, or a Google/MetaMask endorsement.
5. Declare the single purpose and actual data handling, including local URL/form inspection and public-list downloads. Explain the requested host and scripting permissions.
6. Generate the upload package and inspect its manifest/runtime files. Submit for review. Publication depends on Google review and is not complete merely because an upload package exists.

## Suggested listing text

**Name:** Diver — Explainable phishing-risk warnings

**Summary:** Inspect URL and password-form risks, with local domain reputation checks and clear, source-attributed warnings.

**Description:** Diver helps you review suspicious URL signals and declared password-form handling. It checks GET credential exposure, HTTP password pages/destinations, and cross-site form actions in accessible documents. A locally cached MetaMask list adds exact hostname reputation matching for Web3 phishing and scams. Selected risks open an explanatory popup in the visible tab.

Checks run locally. Browsing URLs and password values are not uploaded. The extension downloads provider list data from GitHub and stores that snapshot locally. It does not read entered field values or store browsing-history logs.

Diver does not prevent navigation, verify that a website is safe, or inspect actual JavaScript credential transmissions. Restricted documents, closed shadow DOM, non-HTTP/HTTPS documents, and unlisted threats can be missed. Source reports and structural signals can be mistaken. The URL score is a provisional rule total, not a probability.

**Reviewer test instructions:** Load the package and open a normal HTTPS website. Manually open Diver to inspect URL and reputation results. For controlled transport behavior, run the repository's local form-fixture server and open `/credential-demo` with fields empty; no forms need be submitted. The source list is downloaded on first use, and unavailable downloads are shown explicitly. No account/API key is required for the extension.

## Official publication references

- https://developer.chrome.com/docs/webstore/publish
- https://developer.chrome.com/docs/webstore/program-policies/privacy
