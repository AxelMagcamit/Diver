export function analyzeUrlStructure(url) {
  const findings = [];

  // Rule URL-001: Plain HTTP
  if (url.protocol === "http:") {
    findings.push({
      id: "URL-001",
      name: "Unencrypted HTTP",
      severity: "low",
      score: 10,
      evidence: "The page uses HTTP instead of HTTPS."
    });
  }

  // Rule URL-002: IP address used as hostname
  const ipv4Pattern =
    /^(25[0-5]|2[0-4]\d|1?\d?\d)(\.(25[0-5]|2[0-4]\d|1?\d?\d)){3}$/;

  if (ipv4Pattern.test(url.hostname)) {
    findings.push({
      id: "URL-002",
      name: "IP address hostname",
      severity: "medium",
      score: 20,
      evidence: `The URL uses the IP address ${url.hostname} instead of a domain name.`
    });
  }

  // Rule URL-003: Punycode / encoded internationalized domain
  const labels = url.hostname.split(".");

  if (labels.some(label => label.startsWith("xn--"))) {
    findings.push({
      id: "URL-003",
      name: "Punycode domain",
      severity: "medium",
      score: 20,
      evidence: "The hostname contains a Punycode-encoded domain label."
    });
  }

  // Rule URL-004: Credentials/user-info inside URL
  if (url.username || url.password) {
    findings.push({
      id: "URL-004",
      name: "User information embedded in URL",
      severity: "medium",
      score: 20,
      evidence: "The URL contains user information before the hostname."
    });
  }

  // Rule URL-005: Very long URL
  if (url.href.length > 150) {
    findings.push({
      id: "URL-005",
      name: "Long URL",
      severity: "low",
      score: 10,
      evidence: `The URL is ${url.href.length} characters long.`
    });
  }

  return findings;
}