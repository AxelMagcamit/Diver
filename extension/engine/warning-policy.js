export function getAutomaticWarning(urlResult, formAnalysis) {
  const reasons = new Set();

  if (
    urlResult?.valid &&
    urlResult.supported &&
    urlResult.score >= 60
  ) {
    reasons.add(
      "Several suspicious URL signals were detected."
    );
  }

  for (const form of formAnalysis?.results ?? []) {
    for (const context of [
      form,
      ...(form.submitterResults ?? [])
    ]) {
      const ids = new Set(
        context.findings.map(finding => finding.id)
      );

      if (ids.has("FORM-GET")) {
        reasons.add(
          "A password form declares GET submission, which can expose credentials in the URL."
        );
      }

      if (
        ids.has("FORM-CROSS-SITE") &&
        ids.has("FORM-HTTP")
      ) {
        reasons.add(
          "A password form declares an unencrypted destination on another site."
        );
      }
    }
  }

  return {
    warn: reasons.size > 0,
    reasons: [...reasons]
  };
}