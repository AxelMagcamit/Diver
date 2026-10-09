import { execFileSync } from "node:child_process";
import { readFileSync, existsSync } from "node:fs";
import path from "node:path";
import { fileURLToPath } from "node:url";

const root = path.resolve(path.dirname(fileURLToPath(import.meta.url)), "..");
const tracked = execFileSync("git", ["ls-files", "-z"], { cwd: root, encoding: "utf8" }).split("\0").filter(Boolean);
const problems = [];
let links = 0;

for (const file of tracked) {
  if (/interview|resume-prep|personal-notes/i.test(file)) problems.push(`Private preparation file is tracked: ${file}`);
  if (!file.endsWith(".md") || !existsSync(path.join(root, file))) continue;
  const body = readFileSync(path.join(root, file), "utf8");
  if (/\binterview\b/i.test(body)) problems.push(`Interview preparation reference in public document: ${file}`);
  if (file === "README.md" && /student project|\bI am\b|\bmy rules\b/i.test(body)) problems.push("README wording needs a professional review.");

  for (const match of body.matchAll(/\[[^\]]*\]\(([^)]+)\)/g)) {
    const target = match[1].trim().replace(/^<|>$/g, "");
    if (/^[a-z][a-z0-9+.-]*:|^#/i.test(target)) continue;
    const local = target.split(/[?#]/)[0];
    if (!local) continue;
    links++;
    const resolved = path.resolve(root, path.dirname(file), decodeURIComponent(local));
    if (!resolved.startsWith(root + path.sep) || !existsSync(resolved)) problems.push(`Broken local link in ${file}: ${target}`);
  }
}

const readme = readFileSync(path.join(root, "README.md"), "utf8");
const manifest = JSON.parse(readFileSync(path.join(root, "extension/manifest.json"), "utf8"));
if (!readme.includes(`Current version: ${manifest.version}`)) problems.push("README version does not match the extension manifest.");

if (problems.length) {
  for (const problem of problems) console.error(problem);
  process.exitCode = 1;
} else {
  console.log(`Documentation checks passed: ${links} local links, current version, and private preparation boundaries.`);
}
