import { analyzePasswordForms } from "../../extension/engine/form-analyzer.js";

const scenarios = [
  {
    name: "Same website",
    pageUrl: "https://portal.example.com/login",
    action: "/session",
    context: "A website handles its own login."
  },
  {
    name: "Authentication subdomain",
    pageUrl: "https://portal.example.com/login",
    action: "https://accounts.example.com/session",
    context: "Different hostname, but the same site domain."
  },
  {
    name: "Separate authentication site",
    pageUrl: "https://portal.example.com/login",
    action: "https://identity.example.net/session",
    context:
      "Could be an authorized authentication provider or an unwanted destination. " +
      "The declared action alone cannot distinguish them."
  },
  {
    name: "Different hosted tenant",
    pageUrl: "https://tenant-a.github.io/login",
    action: "https://tenant-b.github.io/session",
    context:
      "Separate tenants count as different sites despite sharing github.io."
  },
  {
    name: "Same website using HTTP",
    pageUrl: "https://portal.example.com/login",
    action: "http://portal.example.com/session",
    context:
      "Same site domain, but the declared destination uses HTTP."
  }
];

console.log("SYNTHETIC SIGN-IN PATTERNS");
console.log("No websites are visited and no forms are submitted.");
console.log("These examples do not measure phishing detection accuracy.\n");

const rows = scenarios.map(scenario => {
  const analysis = analyzePasswordForms(
    scenario.pageUrl,
    [
      {
        hasPasswordField: true,
        action: scenario.action,
        method: "post",
        submitterActions: []
      }
    ]
  );

  const result = analysis.results[0];

  return {
    Pattern: scenario.name,
    "Page site": analysis.pageSite,
    "Destination site": result.destinationSite,
    Relationship: result.relationship,
    Findings: result.findings.map(finding => finding.id).join(", ") || "None"
  };
});

console.table(rows);

console.log("\nHow to interpret the patterns:");

for (const scenario of scenarios) {
  console.log(`\n${scenario.name}`);
  console.log(scenario.context);
}

console.log(
  "\nA cross-site finding identifies a destination relationship. " +
  "It does not establish that the form is phishing."
);