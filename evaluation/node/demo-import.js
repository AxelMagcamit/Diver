import { readFile } from "node:fs/promises";
import { importPhiusiil } from "./phiusiil-importer.js";

const source = JSON.parse(await readFile(new URL("./fixtures/phiusiil-synthetic-source.json", import.meta.url), "utf8"));
const result = await importPhiusiil(new URL("./fixtures/phiusiil-synthetic.csv", import.meta.url), source);
console.log("SYNTHETIC IMPORT DEMO — NOT A REAL DATASET OR ACCURACY TEST");
console.table(result.records.map(({sourceRecordId, url, label}) => ({sourceRecordId, url, label})));
console.log(`Imported: ${result.summary.importedRecords}; phishing labels: ${result.summary.phishing}; legitimate labels: ${result.summary.legitimate}`);
console.log("Original URLs preserved. Invalid URLs remain available for exclusion by the evaluator.");
console.log("Nothing downloaded; no output dataset written.");
