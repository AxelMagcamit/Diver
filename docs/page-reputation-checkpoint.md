# Adding reports for individual pages

Version 0.6.0 added page checks from the same malware-filter publisher already used for domain reports. The goal was to catch supported reported pages on shared services without turning one page report into a warning about the entire service.

## Why this matters

A hosting service can contain many unrelated pages. If one page is reported, that does not mean every page on the same hostname is malicious. Diver therefore checks supported page reports separately from whole-host reports.

The data comes from the publisher's [Vivaldi feed](https://malware-filter.gitlab.io/malware-filter/phishing-filter-vivaldi.txt), documented in its [repository](https://github.com/curbengh/phishing-filter). It is outside threat data, not a list created by Diver.

## How matching works

Diver supports a limited form of the publisher's rules: `||host/path^$document`. It requires the exact hostname and a literal, case-sensitive path/query match. The ending `^` means a separator or the end of the address.

For example, a rule for `/reported`:

- Does not match `/other`, `/reportedElse`, `/reported.html`, or `/reported%2Fother`.
- Can match `/reported/child` or `/reported?campaign=test` because `/` and `?` are separators.
- Keeps any query requirement included in the source rule.

Technically, a separator is any character other than a letter, digit, underscore, dot, percent sign, or hyphen. Fragments are left out when checking a visited address.

Diver does not implement every Adblock-style rule. It skips and counts wildcard, fragment-bearing, root-only, noncanonical, and other unsupported page entries. “Noncanonical” means the entry does not keep the same form when parsed as a URL. It does not expand matches to subdomains, decode paths, use fuzzy matching, or match nonstandard ports. These choices can miss reported variants, but avoid making matches broader than intended.

Whole-host rules are left to the separate host check. An unexpected rule format or an exception rule makes the update fail; Diver does not silently ignore exceptions and apply the blocking rules anyway.

For efficiency, patterns are grouped by hostname. A lookup only checks patterns for the current hostname. Results show the source and timestamps without returning the matched path or the user's query tokens. A page match can still warn if another source fails or MetaMask has an exception for its own list.

## Updates and privacy

Only the fixed public feed is downloaded. The address being checked is not uploaded or added to the cache. Cached paths and queries come from the public source file.

Refresh starts after 12 hours when a check runs. Downloads and publisher update times must both be less than 24 hours old. Downloads have a 15-second timeout, an 8 MiB limit, and a 200,000-entry cap. Failed updates wait 15 minutes before retrying. New data is only used after it is successfully saved; a failed update can keep the previous copy while it is still usable.

The adapted malware-filter data remains under CC BY-SA 4.0, with attribution in the popup and vendor notice. This is more data from the same publisher, not a third independent publisher.

## Test results

The full code test suite passed, including seven page-matching tests. An isolated Chrome profile also checked harmless pages: the reported test page opened the real popup, another page on the same host did not, and closing the warning prevented repeats. No live malicious page was opened.

The downloaded feed dated `2026-10-09T12:03:11Z` produced 27,172 supported page entries and 47 skipped page rules. All real-sized provider caches together used 5,209,134 bytes in Chrome, within the 10 MiB limit.

| Historical sample | Before page checks | After page checks |
| --- | ---: | ---: |
| 78,827 phishing-labeled URLs | 1,721 warnings | 1,890 warnings |
| 107,859 legitimate-labeled URLs | 0 warnings | 0 warnings |
| Separate sample of 4,636 valid legitimate-labeled URLs | 0 warnings | 0 warnings |

That is 169 extra phishing-labeled warnings. The detected share is still only about 2.40%. This is a historical development result, not overall real-world accuracy. The labels were not independently rechecked, overlap with the lists is unknown, and there was no page content to measure form checks. Zero warnings on these legitimate samples does not guarantee zero future false alarms.

## Repeat the comparison

Run `npm run evaluate:pages -- <metamask.json> <general-hosts.txt> <pages.txt> --at 2026-10-09T13:03:11Z` with the recorded source files and checksum-verified development inputs. The report records file and code hashes, counts, and requested feed addresses without raw browsing URLs. No holdout was read or threshold adjusted.

The page feed's SHA-256 is `cb313fba0f8e9cfdf0095d648f2c37cf5cd18d3789db40707d61dbd867926c46`. A hash identifies the exact file used, so another run can check whether its input changed. The evaluator can freeze its clock to repeat an older result; the running extension always uses the real time.

See the [interview guide](interview-guide.md) for a short explanation of the design choice.
