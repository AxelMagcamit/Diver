import { analyzeBrandTitle } from "./candidate-brand-title.js";

const scenarios = [
  {
    name: "Official GitHub example",
    pageUrl: "https://github.com/login",
    pageTitle: "Sign in to GitHub",
    passwordFormCount: 1
  },
  {
    name: "Possible copied branding",
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
    name: "Documentation without password forms",
    pageUrl: "https://docs.example.org/github",
    pageTitle: "GitHub integration guide",
    passwordFormCount: 0
  }
];

console.log("EXPERIMENTAL BRAND-TITLE CHECK");
console.log("Synthetic titles and form counts; no pages are collected.");
console.log("No network requests, phishing verdicts or risk points.\n");

const rows = scenarios.map(scenario => {
  const result = analyzeBrandTitle(scenario);

  return {
    Scenario: scenario.name,
    Site: result.site,
    Status: result.status,
    "Title mentions": result.mentions.join(", ") || "None",
    Candidates:
      result.candidates.map(candidate => candidate.brand).join(", ") ||
      "None"
  };
});

console.table(rows);

console.log(
  "\nThe integration and self-hosted examples are deliberately " +
  "legitimate hypothetical cases. If they produce candidates, " +
  "that demonstrates ambiguity in this heuristic."
);

console.log(
  "\nA matching domain does not establish safety. " +
  "A differing domain does not establish impersonation."
);