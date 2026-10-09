# Diver privacy policy

Effective date: 9 October 2026. Applies to the version 0.6.0 release candidate.

## Purpose

Diver checks local page information for phishing-risk and unsafe password-handling signals, and compares the top page's hostname and supported page URL patterns with downloaded third-party reputation lists from two publishers.

## Information processed on your device

Diver reads the current page URL and, where Chrome allows inspection, the URLs of embedded documents. It inspects form structure: password-field presence, whether fields are named and enabled, declared form actions/methods, and submit-button overrides. Declared actions can contain paths or query parameters; they are used locally to resolve destinations. Displayed form findings retain destination origins/site identifiers rather than action paths or query tokens.

Diver does not read passwords or other values entered into fields. It does not submit forms or inspect actual JavaScript network submissions. Local page inspection can include accessible frames and open shadow DOM.

Page information is used for analysis and popup display. It is not uploaded by Diver, stored as a browsing-history log, or sold. Temporary analysis state is used to coordinate scans and avoid repeated warnings.

## External downloads

Diver downloads the public MetaMask `eth-phishing-detect` configuration from `raw.githubusercontent.com` and the general Phishing Hosts Blocklist and its Vivaldi page-pattern feed from `malware-filter.gitlab.io`. Matching occurs on your device. The provider is not sent the page URL, hostname being checked, form structure, or entered field values in these download requests.

The hosting services can receive normal download metadata such as your IP address, browser user-agent, and request time. Requests omit cookies/credentials and referrer information. GitHub handles its own service data under its [privacy statement](https://docs.github.com/en/site-policy/privacy-policies/github-general-privacy-statement). GitLab operates the other download host; see its [privacy statement](https://about.gitlab.com/privacy/).

Diver's developer does not receive these download requests. This version has no analytics, telemetry, advertising, user accounts, or developer-operated lookup backend.

## Local storage and retention

Diver stores normalized provider blocklist/allowlist entries and snapshot download timestamps in extension storage. The general host and page sources also store their publisher-reported update timestamps. Public provider page patterns can include paths or query parameters; these cached entries come from the feed and are not a log of visited pages. Visited page URLs are matched in memory and are not added to the cache. It requests refresh after 12 hours when a supported check runs and stops using a snapshot once its download age reaches 24 hours if an update fails. A general snapshot is also rejected once its publisher update timestamp is at least 24 hours old, even if downloaded recently. Each source is cached independently.

An expired snapshot may remain stored until replaced or the extension's data is removed; it is not used to return a current match.

The ocean-animation pause preference is saved in local storage. These items remain on your device until replaced or removed. Removing Diver normally removes its extension data; browser-managed backup behavior is controlled by your browser.

## Permissions and controls

Website access and scripting permission allow automatic inspection of HTTP/HTTPS pages and permitted embedded frames. Storage permission is used for the provider snapshot. Chrome may restrict inspection or let you withhold site access; withheld access can prevent automatic checks. You can manage access, disable Diver, or remove it through `chrome://extensions`.

## Changes and contact

The policy will be updated if Diver's data handling changes. For questions or support, open an issue at https://github.com/AxelMagcamit/Diver/issues. GitHub issues are public; do not include passwords, private URLs, authentication tokens, or other sensitive information.

Public policy location: https://github.com/AxelMagcamit/Diver/blob/main/PRIVACY.md. This page must be accessible before Chrome Web Store submission.
