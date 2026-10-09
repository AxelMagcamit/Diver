# Adding a second reputation source

Version 0.5.0 added malware-filter's general phishing-domain list alongside MetaMask's Web3 list. The aim was to cover more reported threats than the Web3 list alone. This checkpoint records that version; later page checks are explained in the [page checkpoint](page-reputation-checkpoint.md).

## What changed

Diver downloads the two lists at the same time and saves them separately. Either list's exact hostname match can open a warning. MetaMask's exceptions only apply to its own list, so they do not cancel a malware-filter match.

If one list fails and the other has no match, Diver says that the check is unavailable or incomplete. It does not treat missing data as proof that a site is safe. A positive match from the working list still warns.

Only the fixed public feed addresses are requested. The visited address and form information are not uploaded. Download requests omit cookies and referrers.

## Keeping the data usable

Each download has a 15-second timeout and an 8 MiB limit. Failed updates wait 15 minutes before another attempt. Diver can keep a previous download while it is still within its use limit.

For the general feed, both the download age and the publisher's update age must be less than 24 hours. Refresh starts after either reaches 12 hours when a check runs. Empty, malformed, oversized, stale, or future-dated updates are rejected. Invalid future-dated stored copies request replacement. The publisher's timestamp tells us when the file was updated, not when every report was independently verified.

The general host check skips IP addresses, unrecognized hostnames, and a limited set of shared service roots. It checks exact hostnames without expanding to parent domains or subdomains. This can miss threats on skipped hosts or unlisted subdomains.

The source is [Phishing URL Blocklist by malware-filter](https://gitlab.com/malware-filter/phishing-filter), maintained by Ming Di Leom. Its publisher names OpenPhish, IPThreat, and PhishTank as upstream sources. The filters use [CC BY-SA 4.0](https://creativecommons.org/licenses/by-sa/4.0/); attribution and the adaptation notice are included in Diver. This version used the hosts file, not the publisher's browser-filter rules.

## What the comparison showed

The evaluator used the actual matching code with saved source files and verified historical development inputs. It did not visit the dataset websites, read the final holdout, or adjust thresholds.

| Historical sample | Previous automatic warnings | Version 0.5.0 warnings |
| --- | ---: | ---: |
| 78,827 phishing-labeled URLs | 18 | 1,721 |
| 107,859 legitimate-labeled URLs | 0 | 0 |
| Separate sample of 4,636 valid legitimate-labeled URLs | 0 | 0 |

The detected share of phishing labels rose from about 0.0228% to 2.1833%. It was still low. These datasets did not contain page content, so the form layer was not measured. The separate legitimate sample had 4,704 input records, with 68 invalid addresses excluded.

These are historical results, not an independent real-world accuracy estimate. Labels were not independently verified, overlap with the list sources is unknown, and multiple addresses can share a domain. Zero observed wrong warnings does not guarantee zero future wrong warnings.

The general download contained 35,161 eligible hostnames; 34,739 were absent from the earlier MetaMask copy. That counts added list entries, not independently confirmed new threats. Its publisher update time was `2026-10-09T12:03:11Z`.

## Code and browser checks

The normal Node suite and focused checks passed, including replacement of future-dated cache entries. In an isolated Chrome profile, the real-sized lists used about 3.51 MB. A made-up hostname added to the general list opened the real popup with source details and did not reopen after dismissal. No live malicious page was visited.

The version 0.5.0 package contained 28 runtime files, including the modules, source notices, and licenses. It did not include datasets or test pages. This count describes that version, not the current package.

## Repeat the comparison

Use the documented development inputs and manifests, save the source files locally, then run:

```powershell
npm run evaluate:two-source -- <metamask.json> <general-hosts.txt> --at 2026-10-09T16:18:34.196Z
```

Reports go under the ignored `evaluation/results` folder and contain counts and file/code hashes instead of raw browsing addresses. The optional `--at` freezes only the evaluator's clock to repeat this older checkpoint. Without it, freshness is checked at the current time. The extension always uses the real time.

Hashes identify the exact files used:

| File | SHA-256 |
| --- | --- |
| MetaMask JSON | `66640950171514caa26cf3d525ac7b28405cc93a00130891307d16bc8745c86d` |
| General hosts feed | `e80b0ff74ccfe3cbc4c4f37b5c4f13e627646c5476daadc1d4ed340beba66e6c` |
| Development input | `93243918ce1c21aab337b14bc9322471a679abdc2c6f0935f99fb8ea649a4228` |
| Legitimate pilot | `abdcd5fed213b194be0d7ad72eaa49bc0a55cc754b44906b4292d3801739690d` |

For the interview: explain the difference between your rules and outside reports, why matching happens locally, and why an unavailable list cannot establish safety. See the [interview guide](interview-guide.md).
