# Embedded-domain experiment — 8 October 2026

Decision: retain as an experimental candidate; do not promote into the extension.

Scope chosen before scoring: detect the exact label sequence paypal.com followed
by another hostname label, when tldts (private suffixes enabled) identifies a
registrable domain other than paypal.com. Add 30 points, capped at 100, keeping
the inclusive alert threshold at 30. Only HTTP/HTTPS hostnames are inspected.
Paths, queries, fragments, user information, misspellings and other brands are
outside this deliberately narrow experiment.

PayPal's official security guidance is hosted at paypal.com:
[PayPal security guidance](https://www.paypal.com/us/security/learn-about-fake-messages).
This supports the domain reference, not a claim that our rule verifies ownership
or determines every PayPal-related URL's legitimacy. For example,
paypal.com.example.org is within example.org, not paypal.com. Domain-boundary
analysis does not prove who operates a site or whether it has authorization.

Results on the same independently stored development inputs:

| Measure | Baseline | Candidate |
| --- | ---: | ---: |
| PhiUSIIL true positives | 524 | 528 |
| PhiUSIIL false negatives | 78,303 | 78,299 |
| PhiUSIIL recall | 0.6647% | 0.6698% |
| PhiUSIIL false positives | 0 | 0 |
| PhreshPhish false alerts / evaluated | 0 / 4,636 | 0 / 4,636 |

All four matching phishing-labeled URLs were newly flagged. Three share one
hostname, differing by scheme or path; the fourth has another hostname. Thus
four URLs do not represent four independent attack campaigns. The source labels
were not independently verified. Zero benign matches in this limited pilot does
not establish absence of false alarms. The legitimate PhiUSIIL sample remains
homepage-only and the PhreshPhish sample has no queries.

No threshold/engine/popup changes, URL visits, or holdout reads occurred. This
run starts from the unchanged engine; it does not stack the prior path-word
candidate. The broad path-word experiment remains unadopted as well.

Reproduce: `npm run experiment:domain-signal`.
Run boundary checks: `npm run test:candidate-domain`.
Reports include source hashes, implementation hashes, separate source metrics
and newly flagged record IDs under evaluation/results/. All three boundary-test
groups passed, covering multi-part/private suffixes, real subdomains, trailing
dots, non-host references, lookalike substrings and unsupported inputs.

Next practical improvement: display the parsed hostname/registrable domain
clearly in the popup so a user can inspect the destination. Treat this as an
explanation feature, not a claim of improved detection accuracy. A browser-ready
implementation must preserve the shared domain-parsing policy and avoid remote
runtime dependencies.
