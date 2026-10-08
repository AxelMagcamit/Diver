import { analyzePasswordForms } from "../../extension/engine/form-analyzer.js";

const scenarios = [
  {
    name: "External HTTPS destination",
    pageUrl: "https://portal.example.com/login",
    action: "https://collector.example.net/session",
    method: "post",
    explanation:
      "A copied login page could declare an external collection destination. " +
      "Diver can identify the cross-site relationship, but cannot establish " +
      "whether that destination is authorized."
  },
  {
    name: "External HTTP destination",
    pageUrl: "https://portal.example.com/login",
    action: "http://collector.example.net/session",
    method: "post",
    explanation:
      "The declared destination is both cross-site and HTTP. " +
      "Diver should report both properties."
  },
  {
    name: "Same-site HTTPS destination",
    pageUrl: "https://portal.example.com/login",
    action: "/collect",
    method: "post",
    explanation:
      "A hostile page could collect credentials on its own site over HTTPS. " +
      "Diver's current destination rules would produce no findings. " +
      "The analyzer does not know who controls the site."
  }
];

console.log("CONTROLLED FORM CHALLENGES");
console.log("Synthetic structures only. No network requests or submissions.");
console.log("These results are not a phishing accuracy measurement.\n");

const rows = [];

for (const scenario of scenarios) {
  const analysis = analyzePasswordForms(
    scenario.pageUrl,
    [
      {
        hasPasswordField: true,
        action: scenario.action,
        method: scenario.method,
        submitterActions: []
      }
    ]
  );

  const result = analysis.results[0];

  rows.push({
    Challenge: scenario.name,
    "Forms inspected": analysis.passwordForms,
    Relationship: result.relationship,
    Findings:
      result.findings.map(finding => finding.id).join(", ") || "None"
  });
}

console.table(rows);

console.log("\nWhat each result means:");

for (const scenario of scenarios) {
  console.log(`\n${scenario.name}`);
  console.log(scenario.explanation);
}

console.log(
  "\nConclusion: destination analysis identifies declared properties. " +
  "It cannot by itself distinguish legitimate and phishing forms."
);