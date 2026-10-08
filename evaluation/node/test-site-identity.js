import test from "node:test";
import assert from "node:assert/strict";
import { getSiteIdentity } from "../../extension/engine/site-identity.js";

const cases = [
  {
    name: "Ordinary website",
    url: "https://www.example.com/",
    label: "Site domain",
    value: "example.com"
  },
  {
    name: "Misleading domain inside hostname",
    url: "https://paypal.com.example.org/login",
    label: "Site domain",
    value: "example.org"
  },
  {
    name: "Multi-part domain ending",
    url: "https://shop.example.co.uk/",
    label: "Site domain",
    value: "example.co.uk"
  },
  {
    name: "Separate hosted website",
    url: "https://tenant.github.io/",
    label: "Site domain",
    value: "tenant.github.io"
  },
  {
    name: "Domain text before the actual hostname",
    url: "https://paypal.com@example.org/",
    label: "Site domain",
    value: "example.org"
  },
  {
    name: "IP address",
    url: "http://192.0.2.1/",
    label: "IP address",
    value: "192.0.2.1"
  }
];

for (const item of cases) {
  test(item.name, () => {
    const result = getSiteIdentity(item.url);

    assert.ok(result);
    assert.equal(result.label, item.label);
    assert.equal(result.value, item.value);
  });
}

test("Unsupported browser page", () => {
  assert.equal(getSiteIdentity("chrome://extensions/"), null);
});

test("Invalid input", () => {
  assert.equal(getSiteIdentity("not a URL"), null);
});