import { mkdir, readFile, writeFile } from "node:fs/promises";
import { resolve } from "node:path";
import { fileURLToPath, pathToFileURL } from "node:url";
import { analyzeUrl } from "../../extension/engine/analyzer.js";

async function main() {
  const inputArgument = process.argv[2];

  const inputFile = inputArgument
    ? pathToFileURL(resolve(inputArgument))
    : new URL("./sample-urls.json", import.meta.url);

  const contents = await readFile(inputFile, "utf8");
  const urls = JSON.parse(contents);

  if (
    !Array.isArray(urls) ||
    !urls.every(url => typeof url === "string")
  ) {
    throw new Error(
      "The input file must contain an array of URL strings."
    );
  }

  const results = urls.map(url => analyzeUrl(url));

  const rows = results.map(result => ({
    URL: result.url,
    Valid: result.valid ? "Yes" : "No",
    Supported: result.supported ? "Yes" : "No",
    Score: result.supported ? result.score : "N/A",
    Findings: !result.valid
      ? "Invalid URL"
      : !result.supported
        ? "Unsupported protocol"
        : result.findings.map(finding => finding.id).join(", ") || "None"
  }));

  console.table(rows);

  const validCount = results.filter(result => result.valid).length;

  const summary = {
    totalInputs: results.length,
    validUrls: validCount,
    supportedUrls: results.filter(result => result.supported).length,
    unsupportedUrls: results.filter(result => result.valid && !result.supported).length,
    invalidInputs: results.length - validCount
  };

  console.log(`Total inputs: ${summary.totalInputs}`);
  console.log(`Valid URLs: ${summary.validUrls}`);
  console.log(`Supported web URLs: ${summary.supportedUrls}`);
  console.log(`Unsupported URLs: ${summary.unsupportedUrls}`);
  console.log(`Invalid inputs: ${summary.invalidInputs}`);

  const report = {
    generatedAt: new Date().toISOString(),
    inputFile: fileURLToPath(inputFile),
    summary,
    results
  };

  const outputDirectory = new URL("../results/", import.meta.url);
  const outputFile = new URL("latest-report.json", outputDirectory);

  await mkdir(outputDirectory, { recursive: true });

  await writeFile(
    outputFile,
    JSON.stringify(report, null, 2) + "\n",
    "utf8"
  );

  console.log("\nReport saved to evaluation/results/latest-report.json");
}

main().catch(error => {
  console.error(`Evaluation failed: ${error.message}`);
  process.exitCode = 1;
});