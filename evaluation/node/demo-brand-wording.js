import { analyzeBrandTitle } from "./candidate-brand-title.js";

// Deliberately narrow English patterns.
// These are experimental text matches, not phishing rules.
const signInPatterns = {
  GitHub: [
    /\b(?:sign in|log in|login)\s+(?:to\s+)?github\b/i,
    /\bgithub\s+(?:sign in|log in|login)\b/i
  ],
  GitLab: [
    /\b(?:sign in|log in|login)\s+(?:to\s+)?gitlab\b/i,
    /\bgitlab\s+(?:sign in|log in|login)\b/i,
    /^\s*(?:sign in|log in|login)\s*[·|—–-]\s*gitlab\s*$/i
  ]
};

const scenarios = [
  {
    name: "Official GitHub",
    pageUrl: "https://github.com/login",
    pageTitle: "Sign in to GitHub",
    passwordFormCount: 1
  },
  {
    name: "Possible copied sign-in title",
    pageUrl: "https://account.example.net/login",
    pageTitle: "Sign in to GitHub",
    passwordFormCount: 1
  },
  {
    name: "Hypothetical legitimate integration",
    pageUrl: "https://portal.example.org/login",
    pageTitle: "Sign in or continue with GitHub",
    passwordFormCount: 1
  },
  {
    name: "Hypothetical self-hosted GitLab",
    pageUrl: "https://code.example.org/users/sign_in",
    pageTitle: "Sign in · GitLab",
    passwordFormCount: 1
  },
  {
    name: "Copied page with generic title",
    pageUrl: "https://account.example.net/login",
    pageTitle: "Welcome",
    passwordFormCount: 1
  },
  {
    name: "Hypothetical legitimate GitHub guide",
    pageUrl: "https://portal.example.org/login",
    pageTitle: "How to sign in to GitHub",
    passwordFormCount: 1
  }
];

function narrowCandidates(result, pageTitle) {
  return result.candidates.filter(candidate => {
    const patterns = signInPatterns[candidate.brand] ?? [];
    return patterns.some(pattern => pattern.test(pageTitle));
  });
}

console.log("BRAND WORDING COMPARISON");
console.log("Synthetic examples only; no pages or credentials collected.");
console.log("No risk points or phishing verdicts.\n");

const rows = scenarios.map(scenario => {
  const broad = analyzeBrandTitle(scenario);
  const narrow = narrowCandidates(broad, scenario.pageTitle);

  return {
    Scenario: scenario.name,
    Title: scenario.pageTitle,
    "Broad candidate":
      broad.candidates.map(candidate => candidate.brand).join(", ") ||
      "None",
    "Sign-in wording candidate":
      narrow.map(candidate => candidate.brand).join(", ") ||
      "None"
  };
});

console.table(rows);

console.log("\nInterpretation:");
console.log("- Specific wording removes the integration example.");
console.log("- Self-hosted GitLab still produces a candidate.");
console.log("- A guide containing sign-in wording still produces a candidate.");
console.log("- A copied page with a generic title produces no candidate.");
console.log(
  "- These examples illustrate tradeoffs; they do not measure accuracy."
);