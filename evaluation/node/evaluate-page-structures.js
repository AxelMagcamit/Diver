import { readFile, mkdir, writeFile } from "node:fs/promises";
import { resolve } from "node:path";
import { analyzePasswordForms } from "../../extension/engine/form-analyzer.js";

const input = process.argv[2]
  ? resolve(process.argv[2])
  : new URL("./fixtures/page-structures.json", import.meta.url);
const output = new URL("../results/latest-page-structure-report.json", import.meta.url);

function requireValue(condition, message) {
  if (!condition) throw new Error(message);
}

function evaluateDataset(dataset) {
  requireValue(dataset?.schemaVersion === 1, "Expected schemaVersion 1.");
  requireValue(dataset.source === "synthetic", "This first runner accepts synthetic examples only.");
  requireValue(Array.isArray(dataset.records) && dataset.records.length > 0,
    "records must be a nonempty array.");
  const ids = new Set();

  return dataset.records.map((record, index) => {
    const prefix = `Record ${index + 1}`;
    requireValue(record && typeof record === "object", `${prefix} must be an object.`);
    requireValue(typeof record.id === "string" && /^[a-z0-9-]+$/.test(record.id),
      `${prefix} needs an id containing lowercase letters, digits or hyphens.`);
    requireValue(!ids.has(record.id), `${prefix} has a duplicate id.`);
    ids.add(record.id);
    requireValue(["available", "unavailable"].includes(record.inspectionStatus),
      `${prefix} needs an available or unavailable inspectionStatus.`);

    if (record.inspectionStatus === "unavailable") {
      requireValue(record.snapshot == null, `${prefix}: unavailable records must not include a snapshot.`);
      requireValue(["restricted-page", "collection-failed"].includes(record.reason),
        `${prefix}: use restricted-page or collection-failed as the reason.`);
      return {
        id: record.id, status: "unavailable", reason: record.reason,
        passwordForms: null, unassociatedPasswordFields: null,
        findingIds: null, analysis: null
      };
    }

    const snapshot = record.snapshot;
    requireValue(snapshot && typeof snapshot === "object", `${prefix} needs a snapshot.`);
    requireValue(typeof snapshot.pageUrl === "string" && typeof snapshot.baseUrl === "string",
      `${prefix}: pageUrl and baseUrl must be strings.`);
    let base;
    try { base = new URL(snapshot.baseUrl); } catch {
      throw new Error(`${prefix}: baseUrl must be a valid HTTP or HTTPS URL.`);
    }
    requireValue(["http:", "https:"].includes(base.protocol), `${prefix}: unsupported baseUrl.`);
    requireValue(Number.isInteger(snapshot.unassociatedPasswordFields) &&
      snapshot.unassociatedPasswordFields >= 0,
      `${prefix}: unassociatedPasswordFields must be a non-negative integer.`);

    const analysis = analyzePasswordForms(snapshot.pageUrl, snapshot.forms, {
      baseUrl: snapshot.baseUrl
    });
    const findings = analysis.results.flatMap(form => [
      ...form.findings,
      ...form.submitterResults.flatMap(button => button.findings)
    ]);

    return {
      id: record.id, status: "inspected", reason: null,
      passwordForms: analysis.passwordForms,
      unassociatedPasswordFields: snapshot.unassociatedPasswordFields,
      findingIds: [...new Set(findings.map(finding => finding.id))],
      analysis
    };
  });
}

try {
  // Validate and analyze every input before writing a new report.
  const dataset = JSON.parse(await readFile(input, "utf8"));
  const results = evaluateDataset(dataset);
  const inspected = results.filter(result => result.status === "inspected");
  const report = {
    schemaVersion: 1,
    generatedAt: new Date().toISOString(),
    source: "synthetic",
    scope: "Declared form structures only; no browsing or form submission.",
    limitations: [
      "Synthetic examples do not measure phishing detection accuracy.",
      "No findings does not establish safety.",
      "Frames, shadow roots and JavaScript submissions are not represented.",
      "Unavailable inspection is not counted as an inspected page."
    ],
    summary: {
      totalRecords: results.length,
      inspectedRecords: inspected.length,
      unavailableRecords: results.length - inspected.length,
      recordsWithFindings: inspected.filter(result => result.findingIds.length > 0).length,
      recordsWithoutPasswordForms: inspected.filter(result => result.passwordForms === 0).length,
      unassociatedPasswordFields: inspected.reduce((sum, result) =>
        sum + result.unassociatedPasswordFields, 0)
    },
    results
  };

  await mkdir(new URL("./", output), { recursive: true });
  // The report contains analyzer results, not raw snapshots or full page URLs.
  await writeFile(output, JSON.stringify(report, null, 2) + "\n");
  console.log("SYNTHETIC PAGE-STRUCTURE EVALUATION — NOT DETECTION ACCURACY\n");
  console.table(results.map(result => ({
    Record: result.id,
    Status: result.status,
    "Password forms": result.passwordForms ?? "N/A",
    "Unassociated fields": result.unassociatedPasswordFields ?? "N/A",
    Findings: result.findingIds === null ? "N/A" : result.findingIds.join(", ") || "None",
    Reason: result.reason ?? "—"
  })));
  console.log(JSON.stringify(report.summary, null, 2));
  console.log("Report saved to evaluation/results/latest-page-structure-report.json");
} catch (error) {
  console.error(`Evaluation failed: ${error.message}`);
  console.error("This run did not complete. Do not treat an existing report as this run's result.");
  process.exitCode = 1;
}
