# Form-destination checkpoint

## Verified behavior

- 19 form-analyzer tests passed.
- 7 browser collector checks passed.
- 7 browser integration checks passed.
- Local popup cases covered no forms, same-site HTTPS,
  cross-site HTTPS, unsupported actions and unassociated fields.
- Restricted-page inspection failure preserved URL results.
- Inspection worked again on the local demo.
- GitHub, GitLab and WordPress.com each showed one inspected
  password form with no destination findings in the observed state.

## Synthetic challenges

- External HTTPS: FORM-CROSS-SITE.
- External HTTP: FORM-CROSS-SITE and FORM-HTTP.
- Same-site HTTPS: no destination findings.

## Limits

No findings does not establish safety.
Cross-site submission does not establish phishing.
Same-site HTTPS credential collection remains a blind spot.

Inspection covers declared actions in the top document's ordinary DOM.
It does not inspect frames, shadow roots or JavaScript submissions.
The collector does not read field values.
Form findings do not contribute to the URL score.

These checks do not measure phishing detection accuracy.

## Next experiment

Evaluate password-page title mentions against a limited set of
brand reference domains.

Keep this experiment outside the extension and risk score.
Investigate legitimate integrations and self-hosted services
before considering it as an impersonation signal.