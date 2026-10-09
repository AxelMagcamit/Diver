export function collectPasswordForms(doc = document) {
  const roots = [doc];

  // Discover open shadow roots, including nested components.
  for (let index = 0; index < roots.length; index++) {
    for (const host of roots[index].querySelectorAll("*")) {
      if (host.shadowRoot) {
        roots.push(host.shadowRoot);
      }
    }
  }

  const forms = roots.flatMap(root =>
    Array.from(root.querySelectorAll("form")).filter(form =>
      form.namespaceURI === "http://www.w3.org/1999/xhtml"
    )
  );

  const controls = roots.flatMap(root =>
    Array.from(root.querySelectorAll("input, button"))
  );

  const passwordInputs = controls.filter(control =>
    control.localName === "input" &&
    control.type === "password"
  );

  const snapshots = forms.map(form => {
    const hasPasswordField = passwordInputs.some(input =>
      input.form === form
    );

    // Count eligible fields without reading their values.
    const namedEnabledPasswordFields = passwordInputs.filter(
      input =>
        input.form === form &&
        !input.matches(":disabled") &&
        !input.closest("datalist") &&
        input.hasAttribute("name") &&
        input.getAttribute("name") !== ""
    ).length;

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
        // null means this attribute is inherited from the form.
        action: control.getAttribute("formaction"),
        method: control.getAttribute("formmethod"),
        disabled: control.matches(":disabled")
      }));

    return {
      hasPasswordField,
      namedEnabledPasswordFields,
      action: form.getAttribute("action"),
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
      scope: "Current document, ordinary DOM and open shadow DOM",
      includesFrames: false,
      includesShadowRoots: true,
      includesClosedShadowRoots: false,
      observesJavaScriptRequests: false
    }
  };
}