# Synthetic limitation challenges

Run `npm run demo:challenges` from the project root.

Ten invented scenarios use reserved example domains to demonstrate the current
shared engine's behavior. No websites are visited. Scenarios have expected rule
scores, not verified phishing/legitimate labels. Passing a check means expected
behavior was reproduced, not that the detector classified a real site correctly.
Do not combine this output with dataset accuracy results.

The cases cover ordinary paths and queries, HTTP, long query strings,
internationalized hostnames, combined signals, short HTTPS hosting URLs,
imagined redirects, and short versus long fragments.

Key observations:

- An imagined ordinary page and imagined harmful content at the exact same URL
  produce identical scores. The URL engine has no page-content input.
- A harmless HTTP/internationalized-hostname scenario scores 30 and reaches the
  existing evaluation threshold. This demonstrates possible false alerts without
  measuring their real-world frequency.
- At threshold 10, ordinary HTTP, long queries and long fragments also flag.
- Short HTTPS URLs in imagined harmful hosting/redirect scenarios score zero.
  The engine neither inspects page content nor follows redirect destinations.
- Length includes fragments, so client-side state can increase the score even
  when the document path is unchanged.

The command checks all expected scores and finding IDs and fails if behavior
changes. Review those expectations deliberately when changing engine rules.
Its output is evaluation/results/synthetic-challenges.json (overwritten each run,
Git-ignored), clearly marked synthetic and containing no accuracy metrics.

All ten scenarios passed on 8 October 2026. No rules, thresholds, popup assets,
or holdout data changed. Next, review options for a more representative legitimate
URL evaluation source before tuning the detector. The challenge scenarios are
useful regression examples, not a replacement for independent labels.
