import { readFile, mkdir, writeFile } from "node:fs/promises";
import { evaluateLabeledRecords } from "./labeled-evaluation.js";

async function main() {
  const args = process.argv.slice(2);
  if (args.length > 1 || (args.length === 1 && !/^\d+$/.test(args[0]))) {
    throw new Error("Usage: npm run demo:labeled -- 30 (integer threshold 0–100)");
  }
  const threshold = args.length ? Number(args[0]) : 30;
  const fixture = JSON.parse(await readFile(new URL("./fixtures/synthetic-labeled.json", import.meta.url), "utf8"));
  if (fixture.kind !== "synthetic") throw new Error("This demo requires a synthetic fixture.");
  const report = {
    kind: "synthetic",
    description: fixture.description,
    generatedAt: new Date().toISOString(),
    inputFile: "evaluation/node/fixtures/synthetic-labeled.json",
    ...evaluateLabeledRecords(fixture.records, { threshold })
  };

  console.log("SYNTHETIC WORKFLOW DEMO — NOT DIVER DETECTION ACCURACY");
  console.log(`Invented labels; shared engine scores. Flagged when score >= ${threshold}.\n`);
  console.table(report.results.map(row => ({
    URL: row.url,
    "Invented label": row.label ?? "Unknown",
    Score: row.analysis?.score ?? "N/A",
    Outcome: row.outcome?.toUpperCase() ?? "Excluded",
    Reason: row.skipped ?? "—"
  })));
  console.log(`Inputs: ${report.summary.totalInputs}; evaluated: ${report.summary.evaluatedInputs}; excluded: ${report.summary.excludedInputs}`);
  console.table([report.summary.exclusions]);
  console.table([report.metrics.counts]);
  const percent = value => value === null ? "N/A" : `${(value * 100).toFixed(1)}%`;
  console.table([Object.fromEntries(
    ["precision", "recall", "falsePositiveRate", "f1", "accuracy"].map(key => [key, percent(report.metrics[key])])
  )]);

  const directory = new URL("../results/", import.meta.url);
  await mkdir(directory, { recursive: true });
  await writeFile(new URL("synthetic-labeled-report.json", directory), JSON.stringify(report, null, 2) + "\n", "utf8");
  console.log("Saved evaluation/results/synthetic-labeled-report.json (synthetic only).");
}

main().catch(error => {
  console.error(`Synthetic evaluation failed: ${error.message}`);
  process.exitCode = 1;
});
