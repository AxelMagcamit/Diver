# Navigation warning checkpoint — version 0.6.1

Previously, dismissing a warning marked the entire top document as warned. A site could then change to another reported path using history.pushState or history.replaceState without getting a new warning. The existing tab URL-change event already initiated inspection, but the document-wide flag suppressed its result.

## Change

Warning suppression now records the last successfully claimed destination in the isolated document state. It retains path and query constraints but removes fragments. Repeated scans of that warned destination stay suppressed; another path or query can warn within the same document. Full navigation creates new document state. This is one in-memory last-warning claim, not a persisted browsing history or a list of every previously warned route.

The injected claim verifies document.URL against the inspected URL. Each scan supplies a unique token. If a popup attempt fails or a scan is superseded, rollback only releases that scan's own claim; an older failure cannot erase a newer destination's warning. Existing document-ID, generation, focused-window and active-tab checks remain in place. No new permissions, remote code, network interception or main-world history overrides were added.

Normal navigation and URL-change notifications use Chrome's tabs events: https://developer.chrome.com/docs/extensions/reference/api/tabs#event-onUpdated. Redirects are checked at their final inspectable destination; this is not redirect-chain classification or prevention before loading.

## Verification

- The full npm test suite passed after integration. The packaged 0.6.1 extension passed the same local browser navigation checks.
- Seven targeted Node regression tests cover repeated scans, path/query changes, fragments, stale URLs, retry after popup failure, rollback ownership and preservation of watcher state.
- The actual Chrome extension was tested in an isolated profile using a harmless HTTP server bound only to 127.0.0.1. A synthetic .test hostname resolved to that server through the test browser's resolver settings. Provider caches were synthetic and fresh. No real malicious site or personal browser profile was opened.
- HTTP 302 redirect and JavaScript location.replace reached a reported final path and opened an attributed warning.
- history.pushState and history.replaceState to another reported destination opened a new warning after dismissal without reloading the document.
- Fragment changes and repeat mutation scans did not reopen the dismissed warning. A rapid reported-to-clean navigation ended without a stale warning on the clean page.

The checked browser fixture is evaluation/browser/test-navigation.cjs. It requires Playwright and its Chromium browser (optional development dependencies, not shipped to extension users), plus a free localhost port 80. DIVER_PLAYWRIGHT_PATH and DIVER_CHROME_PATH can select a locally installed testing runtime. Run npm run test:navigation-browser after setting up that runtime. It creates a temporary isolated browser profile and closes the browser/server after checking. The same fixture can take an unpacked release-stage path as its argument.

## Limits

This fixes warning delivery, not phishing classification. The 0.6.0 historical coverage remains about 2.40% on the measured phishing development labels; no new accuracy claim is made. Warnings still occur after inspection and do not block navigation, scripts or credential submission. Restricted pages, inaccessible documents, withheld site access and browser popup restrictions can prevent automatic warnings. Live-site VM evaluation remains outstanding.
