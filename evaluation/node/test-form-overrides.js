import test from "node:test";
import assert from "node:assert/strict";
import { analyzePasswordForms } from "../../extension/engine/form-analyzer.js";

function inspect(formChanges = {}, options = {}) {
  return analyzePasswordForms(
    "https://shop.example.com/account",
    [{
      hasPasswordField: true,
      action: "/session",
      method: "post",
      ...formChanges
    }],
    options
  ).results[0];
}

test("Button action can change a same-site form to cross-site", () => {
  const result = inspect({
    submitterActions: [{
      action: "https://identity.example.org/session",
      method: null,
      disabled: false
    }]
  });

  assert.equal(result.relationship, "same-site");
  assert.equal(result.submitterResults[0].relationship, "cross-site");
  assert.equal(result.submitterResults[0].method, "post");
});

test("A method-only override inherits the form action", () => {
  const result = inspect({
    action: "https://identity.example.org/session",
    submitterActions: [{
      action: null,
      method: "get"
    }]
  });

  assert.equal(result.submitterResults[0].method, "get");
  assert.equal(
    result.submitterResults[0].destinationOrigin,
    "https://identity.example.org"
  );
});

test("An empty button action uses the current page", () => {
  const result = inspect({
    action: "https://identity.example.org/session",
    submitterActions: [{
      action: "",
      method: null
    }]
  });

  assert.equal(result.relationship, "cross-site");
  assert.equal(result.submitterResults[0].relationship, "same-site");
  assert.equal(
    result.submitterResults[0].destinationOrigin,
    "https://shop.example.com"
  );
});

test("A dialog button does not produce destination findings", () => {
  const result = inspect({
    submitterActions: [{
      action: "http://identity.example.org/session",
      method: "dialog"
    }]
  });

  const button = result.submitterResults[0];

  assert.equal(button.relationship, "not-submitted");
  assert.equal(button.destinationOrigin, null);
  assert.deepEqual(button.findings, []);
});

test("A POST button can override a dialog form", () => {
  const result = inspect({
    method: "dialog",
    submitterActions: [{
      action: "https://identity.example.org/session",
      method: "post"
    }]
  });

  assert.equal(result.relationship, "not-submitted");
  assert.equal(result.submitterResults[0].relationship, "cross-site");
  assert.equal(result.submitterResults[0].method, "post");
});

test("Disabled button overrides are skipped", () => {
  const result = inspect({
    submitterActions: [{
      action: "https://identity.example.org/session",
      method: "post",
      disabled: true
    }]
  });

  assert.equal(result.skippedDisabledSubmitters, 1);
  assert.deepEqual(result.submitterResults, []);
});

test("Relative button actions use the document base URL", () => {
  const result = inspect(
    {
      submitterActions: [{
        action: "session",
        method: null
      }]
    },
    {
      baseUrl: "https://identity.example.org/forms/"
    }
  );

  assert.equal(
    result.submitterResults[0].destinationOrigin,
    "https://identity.example.org"
  );
});

test("Empty or invalid method overrides default to GET", () => {
  for (const method of ["", "invalid"]) {
    const result = inspect({
      method: "post",
      submitterActions: [{ action: null, method }]
    });

    assert.equal(result.submitterResults[0].method, "get");
  }

  const result = inspect({
    submitterActions: [{ action: null, method: "POST" }]
  });

  assert.equal(result.submitterResults[0].method, "post");
});