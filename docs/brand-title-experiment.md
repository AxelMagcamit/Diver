# Brand-title experiment

## Question

Can brand mentions in password-page titles help identify impersonation
when the page uses a different site domain?

## Scope

Synthetic titles, URLs and password-form counts only.

No real pages were collected for this experiment.
No phishing detection accuracy was measured.

The limited reference domains were github.com and gitlab.com.
They are not a complete inventory of legitimate brand-related sites.

## Observations

The broad brand-mention candidate identified the copied-branding example,
but also identified hypothetical legitimate integrations and self-hosted
GitLab.

Narrowing the candidate to specific English sign-in wording removed
the illustrated integration case.

However, the narrower candidate still identified:
- A hypothetical legitimate guide containing sign-in wording.
- A hypothetical legitimate self-hosted GitLab page.

Both candidates missed the copied-page example with a generic title.

## Decision

Set this candidate aside pending independent evidence.

Do not add it to the extension, popup or risk score.
Do not present a title/domain mismatch as proof of impersonation.

The synthetic examples illustrate ambiguity and coverage limitations.
They do not establish a real-world false-positive rate or recall.

## Next evaluation

Build a structured collection of page-structure observations.

Separate:
- Controlled local fixtures used to verify behavior.
- Legitimate-page observations used to investigate compatibility.
- Independently labeled phishing-page structures used to evaluate detection.

Record collection context and unavailable inspection explicitly.
Keep development examples separate from final evaluation examples.