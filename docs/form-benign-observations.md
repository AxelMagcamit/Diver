# Diver: legitimate login-page observations

## Scope

Manual observations of three official login pages.

No credentials are entered and no forms are submitted.
Form findings do not affect the URL score.

This small sample does not measure phishing detection accuracy
or establish a reliable false-positive rate.

## Results

| Page | Date | Visible password field? | Password forms inspected | Form finding IDs | URL score | Notes |
|---|---|---|---|---|---|---|
| GitHub | Pending | Pending | Pending | Pending | Pending | |
| GitLab | Pending | Pending | Pending | Pending | Pending | |
| WordPress.com | Pending | Pending | Pending | Pending | Pending | |

## Recording rules

- Record what the popup actually shows.
- Use "None" only when inspection succeeds without form findings.
- Use "Unavailable" when page inspection fails.
- Record zero forms separately from unavailable inspection.
- Note redirects, already-signed-in pages, or missing password fields.
- Do not copy credentials, URL tokens, or full form actions.
- A cross-site finding alone does not establish phishing.
- No findings does not establish safety.