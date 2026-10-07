import { createReadStream } from "node:fs";
import { Transform } from "node:stream";
import { pipeline } from "node:stream/promises";
import { createHash } from "node:crypto";
import { parse } from "csv-parse";

export async function importPhiusiil(inputPath, provenance) {
  if (!provenance || !["synthetic", "dataset"].includes(provenance.kind)) {
    throw new TypeError("Source metadata must declare kind: synthetic or dataset.");
  }
  for (const key of ["sourceName", "sourceUrl", "license"]) {
    if (typeof provenance[key] !== "string" || !provenance[key].trim()) {
      throw new TypeError(`Source metadata requires ${key}.`);
    }
  }
  if (!/^[a-f0-9]{64}$/i.test(provenance.csvSha256 ?? "")) {
    throw new TypeError("Source metadata requires the CSV's SHA-256 checksum.");
  }
  const validDate = value => typeof value === "string" &&
    /^\d{4}-\d{2}-\d{2}T/.test(value) && Number.isFinite(Date.parse(value));
  if (provenance.kind === "dataset" && !validDate(provenance.retrievedAt)) {
    throw new TypeError("Dataset metadata requires an ISO retrieval timestamp.");
  }
  if (provenance.observedAt != null && !validDate(provenance.observedAt)) {
    throw new TypeError("Observed date must be an ISO timestamp or null when unknown.");
  }

  const hash = createHash("sha256");
  let headers;
  const parser = parse({
    bom: true,
    skip_empty_lines: true,
    columns: fields => {
      if (new Set(fields).size !== fields.length) throw new Error("Duplicate CSV column names.");
      if (!fields.includes("URL") || !fields.includes("label")) {
        throw new Error("Expected CSV columns URL and label (case-sensitive).");
      }
      headers = fields;
      // Ignore engineered features, but retain strict CSV row-length checking.
      return fields.map(name => ["URL", "label", "FILENAME"].includes(name) ? name : false);
    }
  });
  const records = [];
  const labelCounts = { phishing: 0, legitimate: 0 };
  await pipeline(
    createReadStream(inputPath),
    new Transform({ transform(chunk, encoding, callback) { hash.update(chunk); callback(null, chunk); } }),
    parser,
    async source => {
      for await (const row of source) {
        const sourceRow = records.length + 1;
        if (row.label !== "0" && row.label !== "1") {
          throw new Error(`Data record ${sourceRow}: label must be exactly 0 or 1.`);
        }
        const label = row.label === "0" ? "phishing" : "legitimate";
        labelCounts[label]++;
        records.push({
          url: row.URL,
          label,
          source: provenance.sourceName,
          sourceRecordId: row.FILENAME || `record-${sourceRow}`,
          sourceRow,
          observedAt: provenance.observedAt ?? null
        });
      }
    }
  );
  if (!headers || records.length === 0) throw new Error("CSV has no data records.");
  const csvSha256 = hash.digest("hex");
  if (csvSha256 !== provenance.csvSha256.toLowerCase()) {
    throw new Error("CSV checksum does not match the source metadata.");
  }
  return {
    kind: provenance.kind,
    schemaVersion: 1,
    importedAt: new Date().toISOString(),
    provenance: { ...provenance, csvSha256, observedAt: provenance.observedAt ?? null },
    labelMapping: { "0": "phishing", "1": "legitimate" },
    summary: { importedRecords: records.length, ...labelCounts },
    records
  };
}
