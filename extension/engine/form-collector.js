export function collectPasswordForms(doc = document) {
  const forms = Array.from(doc.forms);

  const controls = Array.from(
    doc.querySelectorAll("input, button")
  );

  const passwordInputs = controls.filter(
    control =>
      control.localName === "input" &&
      control.type === "password"
  );

  const snapshots = forms.map(form => {
    const hasPasswordField = passwordInputs.some(
      input => input.form === form
    );

    const submitterActions = controls
      .filter(control => {
        if (control.form !== form) {
          return false;
        }

        const isSubmitter =
          control.type === "submit" ||
          (
            control.localName === "input" &&
            control.type === "image"
          );

        return (
          isSubmitter &&
          (
            control.hasAttribute("formaction") ||
            control.hasAttribute("formmethod")
          )
        );
      })
      .map(control => ({
        // null means the button does not override this attribute.
        action: control.getAttribute("formaction"),
        method: control.getAttribute("formmethod"),
        disabled: control.matches(":disabled")
      }));

    return {
      hasPasswordField,

      // Preserve the declared action without adding a scheme.
      action: form.getAttribute("action"),

      // Browser-normalized method: normally "get", "post", or "dialog".
      method: form.method,

      submitterActions
    };
  });

  return {
    pageUrl: doc.URL,
    baseUrl: doc.baseURI,
    forms: snapshots,

    unassociatedPasswordFields: passwordInputs.filter(
      input => input.form === null
    ).length,

    coverage: {
      scope: "Current document, ordinary DOM",
      includesFrames: false,
      includesShadowRoots: false,
      observesJavaScriptRequests: false
    }
  };
}