# Page reputation checkpoint — version 0.6.0

Diver adds supported page-specific reports from the same malware-filter publisher already used for host reports. A reported page on shared hosting can warn without turning that page report into a report against every page on its host. Automatic warnings remain advisory and appear after inspection; they do not block page loading.

## Matching and limits

The feed is https://malware-filter.gitlab.io/malware-filter/phishing-filter-vivaldi.txt, documented by https://github.com/curbengh/phishing-filter. It contains Vivaldi document rules. Diver implements a conservative subset of literal rules shaped like `||host/path^$document`, with exact hostname, case-sensitive serialized pathname/query and separator-or-end matching. It does not claim full Adblock compatibility. A separator excludes letters, digits, underscore, dot, percent and hyphen. A report for /reported does not match /reportedElse, /reported.html or /reported%2Fother; it can match /reported/child or /reported?query, consistent with the declared ending separator. Query constraints in a source pattern are retained. Fragments are excluded from candidate matching.

Wildcard, fragment-bearing, noncanonical, root-only or otherwise unsupported page entries are counted and omitted. No subdomain expansion, fuzzy matching, URL decoding or nonstandard-port matching is added. Host-only feed rules are handled by the separate host source. Exceptions or an unexpected document-rule format reject the refresh rather than silently overriding exceptions. This narrowing favors avoiding overbroad warnings and can miss reported variants.

The source is indexed by exact hostname before checking its page patterns. A page result includes source identity, scope and timestamps; it does not return the matched path or browsing query tokens. Popup findings explain omitted patterns and matching limits. A positive page match still warns if another check is unavailable or MetaMask has an allowlist exception.

## Freshness, privacy and licensing

Downloads omit credentials and referrers and fetch only the fixed public feed URL. No visited URL is uploaded or added to storage. The cached paths/queries originate in the public provider feed. Refresh at 12 hours, stop using data at 24 hours (both publisher timestamp and download age), 15-minute failure backoff, 15-second download timeout, 8 MiB size limit and 200,000-entry cap. Persistence must succeed before a snapshot becomes active; malformed updates retain a preceding usable cache.

The malware-filter dataset adaptation remains CC BY-SA 4.0 and is attributed in the popup and packaged vendor notice. This is additional coverage from the same publisher, not a third independent threat source.

## Verification

- Full npm test suite passed, including seven new page-reputation tests for shared-host boundaries, query constraints, privacy, warning scope, unsupported inputs, malformed/exception feeds, expiry, concurrent requests, quota failures and future caches.
- An isolated Chrome for Testing profile loaded the extension with real-sized provider caches. A harmless locally routed reported page opened the real Chrome action popup; another page on the same synthetic host did not. Closing the warning suppressed repeated warnings. No listed malicious page was visited.
- Feed snapshot updated 2026-10-09T12:03:11Z: 27,172 supported page entries, 47 omitted page rules. SHA-256 cb313fba0f8e9cfdf0095d648f2c37cf5cd18d3789db40707d61dbd867926c46. Chrome cache usage with the real-sized lists and controlled fixture: 5,209,134 bytes, below the 10 MiB quota.

## Historical comparison

The frozen evaluator uses only checksum-verified development inputs; no holdout or live website is opened. Source snapshot time is frozen for reproducibility only in the evaluator, never in extension runtime. No threshold tuning was performed.

| Historical input | Before page checks | With page checks |
| --- | ---: | ---: |
| PhiUSIIL development: 78,827 phishing-labeled URLs | 1,721 warnings | 1,890 warnings |
| Same set: 107,859 legitimate-labeled URLs | 0 warnings | 0 warnings |
| Separate PhreshPhish benign pilot: 4,636 valid URLs | 0 warnings | 0 warnings |

The additional 169 phishing-labeled warnings are a measured improvement on this historical input. Coverage is still only about 2.40% of phishing labels. Historical labels are not independently verified current truth; source/dataset overlap is unknown; the form layer has no page data here. Zero observed benign warnings is not a guarantee of zero future false positives. These results do not establish dependable broad real-world protection.

Reproduce with `npm run evaluate:pages -- <metamask.json> <general-hosts.txt> <pages.txt> --at 2026-10-09T13:03:11Z`. The report records input/source/implementation hashes and source requests, and excludes raw browsing URLs. Original two-source evaluator scope remains reproducible separately.

## Interview explanation

“I built the local collection, warning policy and page matching. Reputation data comes from attributed external publishers. Host-only lists miss malicious pages on shared services, so I added narrow page-pattern matching without flagging unrelated pages. I tested matching boundaries and privacy in an isolated browser, and reported limited historical coverage instead of claiming general accuracy.”
