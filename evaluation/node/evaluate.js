import { mkdir, readFile, writeFile } from "node:fs/promises";
import { analyzeUrl } from "../../extension/engine/analyzer.js";

async function main() {
  const inputFile = new URL("./sample-urls.json", import.meta.url);
  const contents = await readFile(inputFile, "utf8");
  const urls = JSON.parse(contents);

  if (!Array.isArray(urls) || !urls.every(url => typeof url === "string")) {
    throw new Error("The input file must contain an array of URL strings.");
  }

  const results = urls.map(url => analyzeUrl(url));

  const rows = results.map(result => ({
    URL: result.url,
    Valid: result.valid ? "Yes" : "No",
    Score: result.valid ? result.score : "N/A",
    Findings: result.valid
      ? result.findings.map(finding => finding.id).join(", ") || "None"
      : "Invalid URL"
  }));

  console.table(rows);

  const validCount = results.filter(result => result.valid).length;

  const summary = {
    totalInputs: results.length,
    validUrls: validCount,
    invalidInputs: results.length - validCount
  };

  console.log(`Total inputs: ${summary.totalInputs}`);
  console.log(`Valid URLs: ${summary.validUrls}`);
  console.log(`Invalid inputs: ${summary.invalidInputs}`);

  const report = {
    generatedAt: new Date().toISOString(),
    inputFile: "evaluation/node/sample-urls.json",
    summary,
    results
  };

  const outputDirectory = new URL("../results/", import.meta.url);
  const outputFile = new URL("sample-report.json", outputDirectory);

  await mkdir(outputDirectory, { recursive: true });
  await writeFile(
    outputFile,
    JSON.stringify(report, null, 2) + "\n",
    "utf8"
  );

  console.log("\nReport saved to evaluation/results/sample-report.json");
}

main().catch(error => {
  console.error(`Evaluation failed: ${error.message}`);
  process.exitCode = 1;
});