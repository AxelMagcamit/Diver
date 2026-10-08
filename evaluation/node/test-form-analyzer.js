import test from "node:test";
import assert from "node:assert/strict";
import { analyzePasswordForms } from "../../extension/engine/form-analyzer.js";

function inspect(action, options) {
  return analyzePasswordForms(
    "https://shop.example.com/account",
    [{ hasPasswordField: true, action }],
    options
  ).results[0];
}

test("Relative submission stays on the same site", () => {
  const result = inspect("/session");

  assert.equal(result.relationship, "same-site");
  assert.equal(result.destinationOrigin, "https://shop.example.com");
  assert.deepEqual(result.findings, []);
});

test("Another subdomain can belong to the same site", () => {
  const result = inspect("https://accounts.example.com/session");

  assert.equal(result.relationship, "same-site");
  assert.equal(result.destinationSite, "example.com");
});

test("External password submission is identified without declaring phishing", () => {
  const result = inspect("https://identity.example.org/session");

  assert.equal(result.relationship, "cross-site");
  assert.equal(result.destinationSite, "example.org");
  assert.deepEqual(
    result.findings.map(finding => finding.id),
    ["FORM-CROSS-SITE"]
  );
  assert.equal("score" in result, false);
});

test("Different private hosting tenants count as different sites", () => {
  const report = analyzePasswordForms(
    "https://first.github.io/login",
    [{
      hasPasswordField: true,
      action: "https://second.github.io/session"
    }]
  );

  assert.equal(report.results[0].relationship, "cross-site");
});

test("HTTP is identified even when the site domain is unchanged", () => {
  const result = inspect("http://shop.example.com/session");

  assert.equal(result.relationship, "same-site");
  assert.deepEqual(
    result.findings.map(finding => finding.id),
    ["FORM-HTTP"]
  );
});

test("Empty and missing actions use the current page despite a base URL", () => {
  for (const action of ["", null, undefined]) {
    const result = inspect(action, {
      baseUrl: "https://other.example.org/"
    });

    assert.equal(result.relationship, "same-site");
    assert.equal(
      result.destinationOrigin,
      "https://shop.example.com"
    );
  }
});

test("Nonempty relative actions respect the document base URL", () => {
  const result = inspect("session", {
    baseUrl: "https://identity.example.org/forms/"
  });

  assert.equal(result.relationship, "cross-site");
  assert.equal(
    result.destinationOrigin,
    "https://identity.example.org"
  );
});

test("Forms without password fields are skipped", () => {
  const report = analyzePasswordForms(
    "https://example.com/",
    [{ hasPasswordField: false, action: "/search" }]
  );

  assert.equal(report.inspectedForms, 1);
  assert.equal(report.passwordForms, 0);
  assert.deepEqual(report.results, []);
});

test("Invalid and unsupported actions are not reported as same-site", () => {
  const invalid = inspect("https://[");
  const unsupported = inspect("javascript:void(0)");

  assert.equal(invalid.relationship, "unknown");
  assert.equal(
    invalid.findings[0].id,
    "FORM-INVALID-ACTION"
  );

  assert.equal(unsupported.relationship, "unsupported");
  assert.equal(
    unsupported.findings[0].id,
    "FORM-UNSUPPORTED-ACTION"
  );
});

test("Destination query parameters are not retained in results", () => {
  const result = inspect(
    "https://identity.example.org/session?token=example-secret"
  );

  assert.equal(
    result.destinationOrigin,
    "https://identity.example.org"
  );
  assert.equal(
    JSON.stringify(result).includes("example-secret"),
    false
  );
});

test("Malformed inputs fail explicitly", () => {
  assert.throws(() => analyzePasswordForms("not a URL", []));
  assert.throws(() => analyzePasswordForms("https://example.com", null));

  assert.throws(() =>
    analyzePasswordForms(
      "https://example.com",
      [{ hasPasswordField: true, action: 123 }]
    )
  );
});