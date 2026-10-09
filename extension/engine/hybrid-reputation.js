import { checkReputation } from "./reputation.js";
import { checkGeneralReputation } from "./general-reputation.js";

import { checkPageReputation } from "./page-reputation.js";

export function combineReputationChecks(checks) {
  const matches = checks.filter(check => check.status === "listed");
  const complete = checks.every(check => check.status === "listed" || check.status === "not-listed");
  return {
    status: matches.length ? "listed" : complete ? "not-listed" : "unavailable",
    source: matches.length ? matches.map(check => check.source).join("; ") : "Configured reputation sources",
    checks,
    coverageIncomplete: !complete
  };
}

export async function checkHybridReputation(rawUrl, options = {}) {
  const checks = await Promise.all([
    checkReputation(rawUrl, options).catch(() => ({ status: "unavailable", source: "MetaMask eth-phishing-detect" })),
    checkGeneralReputation(rawUrl, options).catch(() => ({ status: "unavailable", source: "Phishing URL Blocklist (malware-filter)" })),
    checkPageReputation(rawUrl, options).catch(() => ({ status: "unavailable", matchType: "page", source: "Phishing URL Blocklist pages (malware-filter)" }))
  ]);
  return combineReputationChecks(checks);
}
