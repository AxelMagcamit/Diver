// This lossy export preserves the current destination analyzer's properties:
// scheme, origin, site relationship, methods and submit-button overrides.
// It deliberately discards URL paths, queries, fragments and credentials.
export function sanitizeFormSnapshot(raw) {
  function safeAction(action) {
    if (action == null || action.trim() === "") return action;
    try {
      const url = new URL(action.trim(), raw.baseUrl);
      return ["http:", "https:"].includes(url.protocol)
        ? `${url.origin}/`
        : url.protocol;
    } catch {
      // Preserve an invalid-action finding without retaining the input text.
      return "http://[";
    }
  }

  return {
    pageUrl: `${new URL(raw.pageUrl).origin}/`,
    baseUrl: `${new URL(raw.baseUrl).origin}/`,
    forms: raw.forms.map(form => ({
      hasPasswordField: form.hasPasswordField,
      action: safeAction(form.action),
      method: form.method,
      submitterActions: form.submitterActions.map(button => ({
        action: safeAction(button.action),
        method: button.method,
        disabled: button.disabled
      }))
    })),
    unassociatedPasswordFields: raw.unassociatedPasswordFields,
    coverage: {
      scope: raw.coverage.scope,
      includesFrames: raw.coverage.includesFrames,
      includesShadowRoots: raw.coverage.includesShadowRoots,
      observesJavaScriptRequests: raw.coverage.observesJavaScriptRequests
    }
  };
}
