import { readFile, writeFile, mkdir } from 'node:fs/promises';
import { createHash } from 'node:crypto';
import { parquetMetadataAsync, parquetReadObjects } from 'hyparquet';
import { compressors } from 'hyparquet-compressors';
const hash = data => createHash('sha256').update(data).digest('hex');
const revision = 'eabec4b7a66324b79cc8a0ad856d1731dc26fe1a';
const info = JSON.parse(await readFile(new URL('./train-file.json', import.meta.url), 'utf8'));
const url = `https://huggingface.co/datasets/phreshphish/phreshphish/resolve/${revision}/${info.path}`;
const output = new URL('./sample-url-only/', import.meta.url);
await mkdir(output); // Refuse to replace an existing retrieval.
let bytes = 0;
const requests = [];
const file = {
  byteLength: info.size,
  async slice(start, end = info.size) {
    if (start < 0 || end > info.size || end <= start || bytes + end - start > 20_000_000) throw new Error('Range or 20 MB transfer limit exceeded.');
    bytes += end - start;
    const response = await fetch(`${url}?range_start=${start}&range_end=${end}`, { headers: { Range: `bytes=${start}-${end - 1}` }, signal: AbortSignal.timeout(45000) });
    if (response.status !== 206 || response.headers.get('content-range') !== `bytes ${start}-${end - 1}/${info.size}`) {
      await response.body?.cancel(); throw new Error('Server did not honor the exact byte range.');
    }
    const data = await response.arrayBuffer();
    if (data.byteLength !== end - start) throw new Error('Truncated range.');
    const name = `range-${start}-${end}.bin`;
    await writeFile(new URL(name, output), Buffer.from(data));
    requests.push({ start, end, bytes: data.byteLength, sha256: hash(Buffer.from(data)), file: name });
    return data;
  }
};
const metadata = await parquetMetadataAsync(file, { initialFetchSize: 8 });
const columns = ['sha256', 'url', 'label', 'date'];
const names = metadata.schema.map(field => field.name);
for (const name of columns) if (!names.includes(name)) throw new Error(`Missing column ${name}`);
const limit = Math.min(2000, Number(metadata.num_rows));
const rows = await parquetReadObjects({ file, metadata, columns, rowStart: 0, rowEnd: limit, compressors });
if (rows.length !== limit) throw new Error('Unexpected pilot row count.');
const counts = {};
const candidates = rows.map((row, index) => {
  if (!['benign', 'phish'].includes(row.label) || typeof row.url !== 'string' || typeof row.sha256 !== 'string') throw new Error('Unexpected label or schema.');
  counts[row.label] = (counts[row.label] || 0) + 1;
  return { url: row.url, label: row.label === 'benign' ? 'legitimate' : 'phishing', sourceLabel: row.label, sourceRecordId: row.sha256, sourceRow: index, sourceDate: row.date, rank: hash(JSON.stringify(['diver-phreshphish-pilot-v1', row.sha256, row.url, index])) };
});
const records = candidates.filter(row => row.sourceLabel === 'benign').sort((a,b) => a.rank < b.rank ? -1 : a.rank > b.rank ? 1 : 0).slice(0,500);
if (!records.length) throw new Error('No benign records in pilot window.');
const provenance = { sourceName: 'PhreshPhish', sourceUrl: 'https://huggingface.co/datasets/phreshphish/phreshphish', revision, split: 'train', file: info.path, publisherFileSha256: info.lfs.oid, fullFileHashVerified: false, retrievedAt: new Date().toISOString(), license: 'CC BY 4.0; publisher requests anti-phishing research use', citation: 'Dalton et al., PhreshPhish, 2025, arXiv:2507.10854', dateMeaning: 'Source date preserved without asserting independent observation or verification.', selection: { windowStart: 0, windowEndExclusive: limit, targetBenign: 500, seed: 'diver-phreshphish-pilot-v1', method: 'Lowest hash ranks among benign rows in first training-shard window; not a dataset-wide random sample.' } };
const dataset = JSON.stringify({ kind: 'dataset', partition: 'development-pilot', provenance, records }, null, 2) + '\n';
await writeFile(new URL('benign-pilot.json', output), dataset);
const manifest = { provenance, schema: metadata.schema, shardRows: Number(metadata.num_rows), windowCounts: counts, selected: records.length, transferBytes: bytes, ranges: requests, outputSha256: hash(dataset) };
await writeFile(new URL('manifest.json', output), JSON.stringify(manifest, (_, value) => typeof value === 'bigint' ? String(value) : value, 2) + '\n');
console.log(JSON.stringify({ shardRows: manifest.shardRows, windowCounts: counts, selected: records.length, transferBytes: bytes, columns }, null, 2));
