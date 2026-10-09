# Windows 11 VM test plan

Status: planned. The Windows 11 VM is available; no completed live-site results have been recorded in this report.

## Purpose

Check whether Diver loads correctly in a fresh browser, opens warnings for recognized reports, and handles normal sites without unnecessary popups. Record real-page observations separately from previous code tests and historical URL datasets.

## Record the environment

Before the batch, record the date and timezone, Windows version, Chrome version, Diver version and Git commit, VM snapshot name, browser protection settings, and reputation-source status/timestamps. Start with the currently reviewed extension, version 0.6.1, and record any change from it.

Use the VM's local browser profile without account sync. Keep browser and OS protection enabled. Take a clean snapshot before visiting reported sites. Use no entered credentials, form submissions, file downloads, or additional page interaction. Keep host sharing disabled. NAT is not complete isolation from the host or local network; network isolation must be reviewed before live visits.

## Batch design

Start with a small functional pilot: up to 10 currently reported pages and 10 normal comparison pages. Record the source, report date, selection method, and whether each reported page was already in Diver's downloaded lists. This size is for finding obvious behavior problems, not estimating general accuracy.

Testing URLs selected from Diver's own sources checks that matching and warnings work. It does not independently establish broad detection coverage. Keep independently selected inputs separate and describe how their labels were checked.

## For each test

1. Assign an ID such as `reported-001` or `normal-001`.
2. Record the expected behavior and evidence for the label before looking at Diver's output.
3. Open the page inside the isolated VM. If Chrome blocks it, record that outcome and do not bypass protection.
4. Note whether the page loads, redirects, appears removed, or cannot be inspected.
5. Record whether Diver opens automatically and how long the observation lasted.
6. Open the manual popup if needed and record source status, URL score, and warning reason. Keep automatic and manual results separate.
7. Save redacted evidence and close the page. Restore the clean snapshot between testing batches.

Use the [results report](vm-test-results.md). Raw URLs and unredacted screenshots belong in the ignored `local/` folder, not public commits.

## Outcomes

| Outcome | Meaning |
| --- | --- |
| Automatic warning | Diver opened its warning; record the rule or source |
| Loaded without automatic warning | Page loaded but no automatic warning appeared during the stated observation period |
| Chrome blocked first | The live page was not inspected; report separately from Diver detection |
| Offline or removed | The intended live page could not be evaluated |
| Inspection unavailable | Chrome/site-access restrictions prevented the relevant check |
| Error or unexpected behavior | Record the failure and retest after a fix |

For a known reported input that loads without a warning, investigate the source data and inspection result before explaining the miss. For a normal comparison page that warns, check the actual reason: a real unsafe form setting is different from an incorrect claim that the page is phishing.

## After the batch

Publish only verified, redacted observations. Report eligible inputs and exclusions separately, preserve source and version information, and explain uncertainty in labels. List bugs with fix commits and retest results. Keep previous versions' results separate rather than silently replacing them.

Before drawing numerical conclusions, state what was measured: automatic warnings on selected inputs, manual source matching, or independently labeled detection. Do not convert blocked, offline, or unavailable inputs into successful detections or safe results.
