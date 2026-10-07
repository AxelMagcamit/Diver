import assert from "node:assert/strict";
import { analyzeUrl } from "../../extension/engine/analyzer.js";

const tests = [
  {
    name: "HTTPS with no matching signals",
    url: "https://example.com/",
    valid: true,
    score: 0,
    ruleIds: []
  },
  {
    name: "Plain HTTP",
    url: "http://example.com/",
    valid: true,
    score: 10,
    ruleIds: ["URL-001"]
  },
  {
    name: "IP address hostname",
    url: "https://192.0.2.1/",
    valid: true,
    score: 20,
    ruleIds: ["URL-002"]
  },
  {
    name: "Punycode hostname",
    url: "https://xn--bcher-kva.example/",
    valid: true,
    score: 20,
    ruleIds: ["URL-003"]
  },
  {
    name: "User information in URL",
    url: "https://user:pass@example.com/",
    valid: true,
    score: 20,
    ruleIds: ["URL-004"]
  },
  {
    name: "Long URL",
    url: "https://example.com/" + "a".repeat(160),
    valid: true,
    score: 10,
    ruleIds: ["URL-005"]
  },
  {
    name: "Multiple signals added together",
    url: "http://user:pass@192.0.2.1/",
    valid: true,
    score: 50,
    ruleIds: ["URL-001", "URL-002", "URL-004"]
  },
  {
    name: "Invalid URL",
    url: "not a valid URL",
    valid: false,
    score: null,
    ruleIds: []
  },
    {
    name: "149-character URL stays below the limit",
    url: "https://example.com/" + "a".repeat(
      149 - "https://example.com/".length
    ),
    valid: true,
    score: 0,
    ruleIds: []
  },
  {
    name: "150-character URL does not trigger the rule",
    url: "https://example.com/" + "a".repeat(
      150 - "https://example.com/".length
    ),
    valid: true,
    score: 0,
    ruleIds: []
  },
  {
    name: "151-character URL triggers the rule",
    url: "https://example.com/" + "a".repeat(
      151 - "https://example.com/".length
    ),
    valid: true,
    score: 10,
    ruleIds: ["URL-005"]
  },
  {
    name: "Username without a password triggers user-info rule",
    url: "https://user@example.com/",
    valid: true,
    score: 20,
    ruleIds: ["URL-004"]
  }
,
{
  "name": "Chrome internal page",
  "url": "chrome://extensions/",
  "valid": true,
  "supported": false,
  "score": null,
  "ruleIds": []
},
{
  "name": "Local file",
  "url": "file:///C:/example.html",
  "valid": true,
  "supported": false,
  "score": null,
  "ruleIds": []
},
{
  "name": "Email link",
  "url": "mailto:user@example.com",
  "valid": true,
  "supported": false,
  "score": null,
  "ruleIds": []
},
{
  "name": "Script URL",
  "url": "javascript:void(0)",
  "valid": true,
  "supported": false,
  "score": null,
  "ruleIds": []
},
{
  "name": "Embedded data URL",
  "url": "data:text/plain,aaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaa",
  "valid": true,
  "supported": false,
  "score": null,
  "ruleIds": []
},
{
  "name": "FTP with IP and credentials",
  "url": "ftp://user:pass@192.0.2.1/",
  "valid": true,
  "supported": false,
  "score": null,
  "ruleIds": []
},
{
  "name": "Blank browser page",
  "url": "about:blank",
  "valid": true,
  "supported": false,
  "score": null,
  "ruleIds": []
},
{
  "name": "Browser extension page",
  "url": "chrome-extension://abcdefghijklmnop/popup.html",
  "valid": true,
  "supported": false,
  "score": null,
  "ruleIds": []
},
{
  "name": "Empty input",
  "url": "",
  "valid": false,
  "supported": false,
  "score": null,
  "ruleIds": []
},
{
  "name": "Non-string input",
  "url": 42,
  "valid": false,
  "supported": false,
  "score": null,
  "ruleIds": []
}
];

let passed = 0;

for (const test of tests) {
  try {
    const result = analyzeUrl(test.url);

    assert.equal(result.valid, test.valid, "Unexpected validity");
    assert.equal(result.supported, test.supported ?? test.valid, "Unexpected support status");
    assert.equal(result.score, test.score, "Unexpected score");
    assert.deepEqual(
      result.findings.map(finding => finding.id).sort(),
      [...test.ruleIds].sort(),
      "Unexpected rule IDs"
    );

    console.log(`PASS: ${test.name}`);
    passed++;
  } catch (error) {
    console.error(`FAIL: ${test.name}`);
    console.error(error.message);
  }
}

console.log(`\n${passed}/${tests.length} tests passed.`);

if (passed !== tests.length) {
  process.exitCode = 1;
}