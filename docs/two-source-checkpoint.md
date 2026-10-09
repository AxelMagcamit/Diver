# Two-source reputation checkpoint

Version 0.5.0 adds a general phishing-domain source alongside the existing MetaMask Web3 list. The previous version's limited detection evidence is retained in release-review.md. This checkpoint strengthens coverage and failure handling; it does not certify dependable general phishing protection.

## Implementation

- MetaMask and malware-filter downloads run concurrently, with independent caches and source results. Either source's exact hostname match can trigger the warning. MetaMask allowlist exceptions apply only to that source.
- If one source is unavailable and the other has no match, the combined result is unavailable with partial coverage. A successful match still warns when another source is unavailable.
- Browsing URLs, form snapshots and field values are not uploaded. Only fixed public feed URLs are fetched; credentials and referrers are omitted.
- Each source has a 15-second download timeout and an 8 MiB response limit. Failed updates back off for 15 minutes and retain a preceding cache only within its use limit.
- The general feed requires a publisher update timestamp. A source timestamp or download age at least 24 hours old is unusable. Future timestamps and malformed/empty/oversized bodies cannot activate a snapshot. Clock-invalid stored snapshots are replaced on a supported check.
- Refresh starts when either general-source age or download age reaches 12 hours. The publisher timestamp is not independent verification of every threat.
- General matching excludes IP/unrecognized-hostname entries and a limited list of shared service roots. It uses exact hostnames with no parent-domain expansion. Known threats on omitted hosts or unlisted subdomains can be missed.
- Source attribution is shown in the popup. The CC BY-SA 4.0 dataset license and adaptation notice are included separately from Diver's own implementation.

The general source is [Phishing URL Blocklist by malware-filter](https://gitlab.com/malware-filter/phishing-filter), maintained by Ming Di Leom. The publisher identifies OpenPhish, IPThreat and PhishTank as upstream sources and publishes its filters under [CC BY-SA 4.0](https://creativecommons.org/licenses/by-sa/4.0/). Diver consumes the hosts format rather than the publisher's browser filter rules.

## Evidence

The frozen detector and same verified historical development inputs were evaluated offline. Runtime modules were used; the driver supplied local downloaded snapshots instead of network requests. No dataset website was visited, no holdout was read and no rule weights/thresholds were tuned.

| Sample | Evaluated | Previous URL/reputation automatic warnings | Version 0.5.0 URL/reputation automatic warnings |
| --- | ---: | ---: | ---: |
| PhiUSIIL phishing-labeled URLs | 78,827 | 18 | 1,721 |
| PhiUSIIL legitimate-labeled URLs | 107,859 | 0 | 0 |
| Separate PhreshPhish legitimate pilot | 4,636 | 0 | 0 |

Phishing-sample recall for these URL/reputation layers rose from 0.0228% to **2.1833%**. It remains low. The form layer was not measured because these datasets contain URL records without page DOM. The benign pilot excluded 68 invalid URLs out of 4,704 input records. Samples are reported separately, not pooled into headline accuracy.

These are historical development results, not an independent real-world effectiveness estimate. Source labels were not independently verified; provider overlap with dataset sources is unknown; several URLs can share a domain. Zero observed false warnings does not establish a zero future false-positive rate.

The general snapshot contained 35,161 eligible hostnames, including 34,739 absent from the earlier MetaMask blocklist snapshot. This is added list coverage, not a count of independently confirmed new threats. The publisher update marker was `2026-10-09T12:03:11Z`.

Source hashes for this comparison:

- MetaMask JSON: `66640950171514caa26cf3d525ac7b28405cc93a00130891307d16bc8745c86d`.
- General hosts feed: `e80b0ff74ccfe3cbc4c4f37b5c4f13e627646c5476daadc1d4ed340beba66e6c`.
- Development input: `93243918ce1c21aab337b14bc9322471a679abdc2c6f0935f99fb8ea649a4228`.
- Benign pilot: `abdcd5fed213b194be0d7ad72eaa49bc0a55cc754b44906b4292d3801739690d`.

## Verification

The normal Node suite passed after integration, including the existing reputation checks and the new general-source checks. A final focused check also passed for clock-invalid cache replacement.

Chrome for Testing loaded the actual extension APIs in an isolated profile. Both real-sized snapshots fit Chrome local storage at about 3.51 MB. A synthetic hostname inserted into the general cache opened the actual warning popup, displayed independent source results and publisher time, and did not reopen after dismissal. These are controlled browser checks, not visits to live malicious pages.

The upload package contains 28 runtime files with both new modules, source attribution and license text. No datasets or development fixtures are bundled.

## Reproduction

Use the previously documented development inputs and manifests. Save both public source files locally, then run:

```powershell
npm run evaluate:two-source -- <metamask.json> <general-hosts.txt> --at 2026-10-09T16:18:34.196Z
```

The evaluator writes a timestamped report under ignored evaluation/results, including input/source/implementation hashes. Reports contain aggregate counts rather than raw browsing URLs. A newly downloaded general snapshot may produce different results; the source content hashes distinguish runs. The optional --at argument freezes the evaluator clock at the original checkpoint time so a retained snapshot can be reproduced later. Omitting it checks source freshness at the current time. This affects only the offline evaluator; the extension always uses the actual clock.

## Interview explanation and claims

Diver separates three kinds of evidence: provisional URL rules, declared credential-handling risks, and third-party threat reports. It matches downloaded data locally, preserves source attribution, rejects expired general-source data, and treats missing coverage as unknown. It explains risks rather than claiming that a low score proves safety.

Suitable project description: “Built a Manifest V3 extension combining URL/password-form analysis with two locally cached reputation sources, source-attributed automatic warnings, privacy-conscious downloads and failure-handling tests.”

Do not claim dependable general protection, a 100% accuracy rate, zero false positives or Chrome Web Store deployment. The remaining detection gate is controlled live-page evidence and broader independent coverage evaluation. Store publication remains pending.
