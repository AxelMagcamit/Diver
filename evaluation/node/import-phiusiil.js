import { readFile, writeFile } from "node:fs/promises";
import { resolve } from "node:path";
import { importPhiusiil } from "./phiusiil-importer.js";

async function main() {
  const args = process.argv.slice(2);
  if (args.length !== 3) {
    throw new Error("Usage: npm run import:phiusiil -- <input.csv> <source.json> <output.json>");
  }
  const [input, metadata, output] = args.map(value => resolve(value));
  const source = JSON.parse(await readFile(metadata, "utf8"));
  const result = await importPhiusiil(input, source);
  // Never overwrite input, provenance, or an existing import.
  await writeFile(output, JSON.stringify(result, null, 2) + "\n", { encoding: "utf8", flag: "wx" });
  console.log(`Imported ${result.summary.importedRecords} records (${result.kind}).`);
  console.log(`Phishing labels: ${result.summary.phishing}; legitimate labels: ${result.summary.legitimate}`);
  console.log(`Saved: ${output}`);
  console.log("Import only: no websites visited, scoring performed, or accuracy measured.");
}
main().catch(error => { console.error(`Import failed: ${error.message}`); process.exitCode = 1; });
