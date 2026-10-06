import { analyzeUrlStructure } from "./rules/url-structure.js";

export function analyzeUrl(rawUrl) {
  try {
    const url = new URL(rawUrl);

    const findings = [
      ...analyzeUrlStructure(url)
    ];

    const score = Math.min(
      findings.reduce((total, finding) => total + finding.score, 0),
      100
    );

    return {
      valid: true,
      url: rawUrl,
      hostname: url.hostname,
      protocol: url.protocol,
      isHttps: url.protocol === "https:",
      score,
      findings
    };

  } catch (error) {
    return {
      valid: false,
      url: rawUrl,
      hostname: null,
      protocol: null,
      isHttps: false,
      score: 0,
      findings: []
    };
  }
}