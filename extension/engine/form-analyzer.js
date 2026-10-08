import { getSiteIdentity } from "./site-identity.js";

function normalizeMethod(value) {
  const method = (value ?? "get").toLowerCase();

  return ["get", "post", "dialog"].includes(method)
    ? method
    : "get";
}

function validateOptionalString(value, name) {
  if (value != null && typeof value !== "string") {
    throw new TypeError(`${name} must be a string or null.`);
  }
}

function analyzeDestination(page, pageSite, baseUrl, action, method) {
  const result = {
    method,
    destinationOrigin: null,
    destinationSite: null,
    relationship: "unknown",
    findings: []
  };

  // Dialog submission does not send form data to a destination.
  if (method === "dialog") {
    result.relationship = "not-submitted";
    return result;
  }

  let destination;

  try {
    const declaredAction = (action ?? "").trim();

    destination = declaredAction
      ? new URL(declaredAction, baseUrl)
      : new URL(page.href);
  } catch {
    result.findings.push({
      id: "FORM-INVALID-ACTION",
      title: "Unable to interpret form destination",
      explanation:
        "The declared form action could not be resolved."
    });

    return result;
  }

  if (!["http:", "https:"].includes(destination.protocol)) {
    result.relationship = "unsupported";

    result.findings.push({
      id: "FORM-UNSUPPORTED-ACTION",
      title: "Non-web form destination",
      explanation:
        "The declared action does not use HTTP or HTTPS."
    });

    return result;
  }

  const destinationIdentity = getSiteIdentity(destination.href);

  // Do not retain destination paths, query parameters or credentials.
  result.destinationOrigin = destination.origin;
  result.destinationSite = destinationIdentity.value;

  const sameSite = pageSite === destinationIdentity.value;

  result.relationship = sameSite ? "same-site" : "cross-site";

  if (!sameSite) {
    result.findings.push({
      id: "FORM-CROSS-SITE",
      title: "Password form submits to another site",
      explanation:
        `The declared destination is ${destinationIdentity.value}, ` +
        `while this page is on ${pageSite}. ` +
        "External sign-in services can also use this pattern."
    });
  }

  if (destination.protocol === "http:") {
    result.findings.push({
      id: "FORM-HTTP",
      title: "Password form declares an HTTP destination",
      explanation:
        "The declared destination uses HTTP rather than HTTPS. " +
        "This check does not observe browser upgrades or actual requests."
    });
  }

  return result;
}

export function analyzePasswordForms(
  pageUrl,
  forms,
  { baseUrl = pageUrl } = {}
) {
  let page;

  try {
    page = new URL(pageUrl);
  } catch {
    throw new TypeError("The page must have a valid HTTP or HTTPS URL.");
  }

  if (!["http:", "https:"].includes(page.protocol)) {
    throw new TypeError("The page must have a valid HTTP or HTTPS URL.");
  }

  if (!Array.isArray(forms)) {
    throw new TypeError("Forms must be an array.");
  }

  const pageSite = getSiteIdentity(page.href).value;
  const results = [];

  forms.forEach((form, formIndex) => {
    if (
      !form ||
      typeof form !== "object" ||
      typeof form.hasPasswordField !== "boolean"
    ) {
      throw new TypeError(
        `Form ${formIndex + 1} needs a hasPasswordField boolean.`
      );
    }

    if (!form.hasPasswordField) {
      return;
    }

    validateOptionalString(form.action, "Form action");
    validateOptionalString(form.method, "Form method");

    const overrides = form.submitterActions ?? [];

    if (!Array.isArray(overrides)) {
      throw new TypeError("submitterActions must be an array.");
    }

    const formMethod = normalizeMethod(form.method);

    const result = {
      formIndex,
      ...analyzeDestination(
        page,
        pageSite,
        baseUrl,
        form.action,
        formMethod
      ),
      submitterResults: [],
      skippedDisabledSubmitters: 0
    };

    overrides.forEach((button, submitterIndex) => {
      if (!button || typeof button !== "object") {
        throw new TypeError("Each submitter override must be an object.");
      }

      validateOptionalString(button.action, "Button action");
      validateOptionalString(button.method, "Button method");

      if (
        button.disabled != null &&
        typeof button.disabled !== "boolean"
      ) {
        throw new TypeError("Button disabled must be a boolean.");
      }

      if (button.disabled === true) {
        result.skippedDisabledSubmitters++;
        return;
      }

      // null/undefined means inherit. An empty string is an override.
      const action = button.action ?? form.action;

      const method = button.method == null
        ? formMethod
        : normalizeMethod(button.method);

      result.submitterResults.push({
        submitterIndex,
        ...analyzeDestination(
          page,
          pageSite,
          baseUrl,
          action,
          method
        )
      });
    });

    results.push(result);
  });

  return {
    pageSite,
    inspectedForms: forms.length,
    passwordForms: results.length,
    results
  };
}