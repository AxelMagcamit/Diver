export function getAutomaticWarning(urlResult, formAnalysis, reputation = null) {
  const reasons = new Set();
  if (reputation?.status === "listed") {
    reasons.add("This exact hostname is listed by MetaMask eth-phishing-detect. The source focuses on Web3 phishing and scams; a report can be mistaken or later removed.");
  }

  if (
    urlResult?.valid &&
    urlResult.supported &&
    urlResult.score >= 60
  ) {
    reasons.add(
      "Several suspicious URL signals were detected."
    );
  }

  // An HTTPS destination does not secure the HTTP page itself.
  if (
    formAnalysis?.pageFindings?.some(
      finding => finding.id === "FORM-HTTP-PAGE"
    )
  ) {
    reasons.add(
      "A password field appears on an HTTP page or frame. " +
      "The page itself is not protected by HTTPS, even if " +
      "the form destination uses HTTPS."
    );
  }

  for (const form of formAnalysis?.results ?? []) {
    const contexts = [
      form,
      ...(form.submitterResults ?? [])
    ];

    for (const context of contexts) {
      const ids = new Set(
        context.findings.map(finding => finding.id)
      );

      if (ids.has("FORM-GET")) {
        reasons.add(
          "A password form declares GET submission, " +
          "which can expose credentials in the URL."
        );
      }

      // Applies to same-site and cross-site destinations.
      // Require metadata indicating an eligible password field.
      if (
        ids.has("FORM-HTTP") &&
        form.namedEnabledPasswordFields > 0
      ) {
        reasons.add(
          "A password form with a named, enabled password " +
          "field declares an HTTP destination. Normal " +
          "submission may send credentials without HTTPS " +
          "protection. Browser upgrades or JavaScript can " +
          "change the actual request."
        );
      } else if (
        ids.has("FORM-CROSS-SITE") &&
        ids.has("FORM-HTTP")
      ) {
        // Preserve the existing cross-site HTTP warning.
        reasons.add(
          "A password form declares an unencrypted " +
          "destination on another site."
        );
      }
    }
  }

  return {
    warn: reasons.size > 0,
    reasons: [...reasons]
  };
}
