# Diver interview guide

Use this to understand the project and practice explaining it in your own words. The examples below describe the current version, 0.6.1. They are not claims that the extension is finished or already published.

## A short introduction

“Diver is my student project: a Chrome extension that explains possible phishing and password-form risks. It checks the website address and form structure, then compares the address with public phishing reports downloaded to the device. It can open a warning automatically. The current version works locally, but its detection coverage is still limited, and I am still evaluating it.”

## How does it work?

“When the user opens a page, Diver checks the address, looks at password forms Chrome allows it to inspect, and checks downloaded reputation lists. A shared warning function decides whether to show a popup. The popup explains the reason instead of only giving a score.”

The extension also checks relevant form changes and address changes. It only opens automatic warnings in the active, focused tab. It does not block the page before loading.

## Why call it hybrid?

“I combined rules in the extension with reports from outside sources. Rules can identify unsafe form settings even when a site is not on a list. Reputation lists can identify reported threats that simple address rules miss. Both have limits, so combining them does not make the result certain.”

There is no trained model or machine-learning classifier in this version.

## Which parts are yours, and which parts come from elsewhere?

“The project code handles address checks, form collection and analysis, list matching, caching, and warnings. The threat reports come from MetaMask and malware-filter. I also use tldts to work out the site domain correctly, including names like example.co.uk. I keep the source names and licenses in the project.”

Development has used AI assistance for code, debugging, and documentation. If asked, explain that help honestly and show the parts you understand. Do not say every line or threat report was written independently. A useful way to prepare is to trace one finding from the input, through the rule, to the popup.

## Does it read passwords?

“No. It reads the form's structure, such as whether a password field exists, whether it is named and enabled, and where the form says it will submit. It does not read what the user types or submit the form.”

The declared form destination can differ from the actual request if page JavaScript changes it. Diver does not monitor those actual submissions.

## Why inspect password forms?

“A website address does not tell the whole story. A password form may declare GET submission, which can put submitted values in the URL, or use an HTTP page or destination. These are useful warnings about password handling. They do not prove the site is phishing.”

If asked about another-site destinations: legitimate authentication services can also use them. That finding alone does not trigger an automatic phishing warning.

## What does the score mean?

“It is the total of the address-rule points, capped at 100. It is not a probability. Form findings and list matches do not add to that score. They are separate warning reasons.”

Example: an HTTP URL with an IPv4 hostname gets 10 + 20 = 30 points. That alone does not reach the automatic address-warning threshold of 60. A reported page match can still trigger a warning even when the address score is zero.

The weights and thresholds are starting choices. They have not been proven optimal, so do not describe them as scientifically calibrated.

## Why download lists instead of sending each address to an API?

“I wanted the matching to happen locally so Diver would not upload the user's browsing addresses. The tradeoff is that the extension stores list data and must manage updates and expiry. The download host still sees normal request information such as the user's IP address.”

There is no developer-operated server or API key in this version.

## What if a list download fails?

“Diver can use its previous download while it is still within the time limit. It tries to refresh after 12 hours when a check runs, and stops using a download after 24 hours. The general feeds also need a recent publisher update time. If a source cannot be used, the result says unavailable. It does not say safe.”

A positive match from another working source can still warn. A failed update waits 15 minutes before another attempt. Each download has a 15-second timeout and an 8 MiB size limit.

## Why match individual pages?

“A hosting service can have many unrelated pages. One reported page should not make the whole service look malicious. I added supported page-pattern checks that keep the exact hostname and path requirements.”

Example: a report for `shared.example.test/reported` does not match `/other` or `/reportedElse`. Depending on the report's ending separator, it can match `/reported/child` or `/reported?campaign=test`. Matching is case-sensitive and does not support every pattern the publisher provides. These limits reduce overly broad matching but can miss variants.

## What was a bug you fixed?

“Originally, dismissing a warning silenced later warnings for the entire document. Some sites change their address without loading a new document, so a different reported destination could be missed. I changed the state to remember the last warned destination. A different path or query can warn again, while repeat checks and fragment changes stay quiet.”

Each scan also has its own token. If an older scan fails, it can only undo its own warning claim, not a newer scan's claim. This handles overlapping asynchronous work.

## How did you test it?

“I used Node tests for rules, matching boundaries, bad inputs, and cache failures. I also loaded the real extension in an isolated Chrome profile and served harmless local pages. Those checks covered forms, automatic popups, redirects, and address changes without a reload.”

These tests check whether the code behaves as intended. They do not measure how well it catches all real phishing sites. Live malicious-page tests in the VM are still pending.

## How accurate is it?

“I do not have an overall real-world accuracy figure. On one historical development set, the address and reputation layers warned on 1,890 of 78,827 phishing-labeled URLs, about 2.40%. That is low coverage. There were no warnings on the measured legitimate samples, but that does not prove there will be no false alarms.”

The data did not include page content, so this result does not measure form checks. Historical labels were not independently rechecked, and overlap between the source lists and datasets is unknown. The final holdout was kept separate from development.

## What are its main limitations?

“It can miss unlisted threats and forms handled through JavaScript. Chrome can restrict page access, and closed shadow DOM cannot be inspected. Warnings happen after inspection, so they do not prevent loading or guarantee that a user will see a warning before interacting. I would describe the current version as a risk-warning project, not complete phishing protection.”

## Is it deployed?

“The source is on GitHub and the extension runs locally. Chrome Web Store publication is still pending.”

## Where should I look in the code?

| File | What to understand |
| --- | --- |
| `extension/manifest.json` | Chrome permissions, background worker, and popup setup |
| `extension/engine/rules/url-structure.js` | Address signals and point values |
| `extension/engine/form-collector.js` | Reading structure without reading typed values |
| `extension/engine/form-analyzer.js` | Resolving and comparing declared destinations |
| `extension/engine/frame-inspection.js` | Combining accessible page/frame results |
| `extension/engine/reputation.js` | MetaMask matching and cached downloads |
| `extension/engine/general-reputation.js` | General phishing host reports and freshness |
| `extension/engine/page-reputation.js` | Narrow page-pattern matching |
| `extension/engine/hybrid-reputation.js` | Combining the source results |
| `extension/engine/warning-policy.js` | Deciding which findings open a warning |
| `extension/engine/warning-state.js` | Preventing repeats without silencing new destinations |
| `extension/automatic-warning.js` | Running scans and opening the Chrome popup |
| `extension/popup/popup.js` | Showing the results to the user |

The background service worker is Chrome's event-driven process for the extension. A cache is a saved copy of downloaded data. An iframe is another document embedded in a page. A query is the part after `?`; a fragment is the part after `#`. A false positive is a warning on a legitimate input. Recall is the fraction of phishing-labeled inputs detected; it is different from overall accuracy.

## A simple practice plan

1. Explain the three checks without looking at this guide.
2. Trace one URL score and one form finding through the code.
3. Explain why a zero score does not mean safe.
4. Describe the navigation bug and its fix with two example paths.
5. State the measured result and its limits without calling it overall accuracy.

If a detail is unclear, look it up in the code before using it in an interview. Being able to explain a small feature clearly is more useful than memorizing technical words.
