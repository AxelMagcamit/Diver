import { analyzeUrlStructure } from "./rules/url-structure.js";

export function analyzeUrl(rawUrl) {
  let url;

  try {
    if (typeof rawUrl !== "string") {
      throw new TypeError("Expected a URL string.");
    }
    url = new URL(rawUrl);
  } catch {
    return {
      valid: false,
      supported: false,
      url: rawUrl,
      hostname: null,
      protocol: null,
      isHttps: false,
      score: null,
      findings: []
    };
  }

  const supported = url.protocol === "http:" || url.protocol === "https:";
  const findings = supported ? analyzeUrlStructure(url) : [];

  return {
    valid: true,
    supported,
    url: rawUrl,
    hostname: url.hostname,
    protocol: url.protocol,
    isHttps: url.protocol === "https:",
    score: supported
      ? Math.min(findings.reduce((total, finding) => total + finding.score, 0), 100)
      : null,
    findings
  };
}
