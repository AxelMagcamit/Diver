# Warning fix: changing addresses without reloading

This checkpoint explains the fix in version 0.6.1. It improves when warnings appear; it does not make the detection rules more accurate.

## The problem

Some websites change their address without loading a new page. For example, they can use JavaScript's `history.pushState` to move from `/first` to `/second` inside the same document.

Previously, closing one Diver warning marked the whole document as already warned. Diver still checked the new address, but the old flag stopped a new popup from opening. This could hide a warning for a different reported destination.

## The fix

Diver now remembers the last destination it warned about, instead of marking the whole document. Another path or query can warn again. Repeated checks of the same warned destination stay quiet. Changing only a fragment, such as `#section`, also stays quiet.

This is one temporary value in the page's isolated extension state. It is not saved to disk as a browsing-history list. Loading a new document gives it new state.

Before claiming a warning, Diver checks that the page's current address still matches the address it inspected. Each scan gets a unique token. If a scan fails, it can only remove its own claim. That prevents an older failed scan from clearing a newer warning's state.

The existing checks for the active tab, focused window, document ID, and latest scan are still used. No new permissions were added. Chrome's [tab update events](https://developer.chrome.com/docs/extensions/reference/api/tabs#event-onUpdated) already tell the worker about address changes.

## What passed

The full Node test suite and the packaged extension checks passed. Seven new tests covered repeats, path/query changes, fragments, stale addresses, retry after failure, older-scan rollback, and keeping the form watcher's state.

In an isolated Chrome profile, harmless local pages showed that:

- An HTTP 302 redirect could reach a reported destination and open a warning.
- A JavaScript `location.replace` redirect could also open a warning at its destination.
- `history.pushState` and `history.replaceState` could open a new warning after an earlier one was closed.
- Fragment changes and repeated form-change scans did not reopen a dismissed warning.
- Quickly moving from a reported path to a clean path ended without a stale warning over the clean page.

The server only listened on `127.0.0.1`. The browser mapped a test hostname to that server, and the reputation caches used made-up test entries. No real malicious site or personal browser profile was opened.

## Repeat the browser check

The fixture is `evaluation/browser/test-navigation.cjs`. It needs Playwright, its Chromium testing browser, and a free localhost port 80. These are development tools, not requirements for people using the extension.

Run `npm run test:navigation-browser` after installing the testing runtime. `DIVER_PLAYWRIGHT_PATH` and `DIVER_CHROME_PATH` can select an existing runtime. The fixture creates a separate temporary browser profile and closes the browser and server afterward. You can pass an unpacked release folder as an argument to test that package too.

## What this does not prove

The fix does not classify an entire redirect chain or stop a page before loading. Warnings still depend on what Diver can inspect and what its rules or lists recognize. Restricted pages, withheld site access, and browser popup restrictions can prevent warnings.

Historical detection coverage remains about 2.40% on the measured phishing labels. Live testing in the VM is still pending.
