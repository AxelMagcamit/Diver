import test from "node:test";
import assert from "node:assert/strict";
import { cp, mkdir, mkdtemp, readFile, rm, writeFile } from "node:fs/promises";
import { tmpdir } from "node:os";
import { basename, dirname, join, resolve } from "node:path";
import { fileURLToPath } from "node:url";
import { spawnSync } from "node:child_process";

const projectRoot = fileURLToPath(new URL("../../", import.meta.url));
const fixture = JSON.parse(await readFile(
  new URL("./fixtures/page-structures.json", import.meta.url), "utf8"
));

async function sandbox(t) {
  // Each check runs the real CLI in its own temporary project.
  // Your project's generated report is never used or overwritten.
  const root = await mkdtemp(join(tmpdir(), "diver-page-runner-"));
  t.after(async () => {
    assert.equal(dirname(resolve(root)), resolve(tmpdir()));
    assert.ok(basename(root).startsWith("diver-page-runner-"));
    await rm(root, { recursive: true, force: true });
  });

  const nodeDirectory = join(root, "evaluation", "node");
  const resultDirectory = join(root, "evaluation", "results");
  await mkdir(join(nodeDirectory, "fixtures"), { recursive: true });
  await mkdir(resultDirectory, { recursive: true });
  await writeFile(join(root, "package.json"), '{"type":"module"}\n');
  await cp(join(projectRoot, "extension", "engine"), join(root, "extension", "engine"), { recursive: true });
  await cp(join(projectRoot, "extension", "vendor"), join(root, "extension", "vendor"), { recursive: true });
  const runner = join(nodeDirectory, "evaluate-page-structures.js");
  await cp(join(projectRoot, "evaluation", "node", "evaluate-page-structures.js"), runner);
  const defaultInput = join(nodeDirectory, "fixtures", "page-structures.json");
  const customInput = join(root, "custom-input.json");
  const reportPath = join(resultDirectory, "latest-page-structure-report.json");
  await writeFile(defaultInput, JSON.stringify(fixture));

  return {
    reportPath,
    async run(dataset = fixture, { useDefault = false, raw = null } = {}) {
      await writeFile(customInput, raw ?? JSON.stringify(dataset));
      return spawnSync(process.execPath,
        useDefault ? [runner] : [runner, customInput],
        { cwd: root, encoding: "utf8", timeout: 15000 });
    },
    async report() {
      return JSON.parse(await readFile(reportPath, "utf8"));
    }
  };
}

function succeeded(run) {
  assert.ifError(run.error);
  assert.equal(run.status, 0, run.stderr);
}

async function rejectsWithoutOverwriting(t, modify, messagePattern, raw = null) {
  const box = await sandbox(t);
  succeeded(await box.run());
  const previous = await readFile(box.reportPath, "utf8");
  const input = structuredClone(fixture);
  modify(input);
  const run = await box.run(input, { raw });
  assert.ifError(run.error);
  assert.equal(run.status, 1, run.stderr);
  assert.match(run.stderr, /Evaluation failed:/);
  if (messagePattern) assert.match(run.stderr, messagePattern);
  assert.equal(await readFile(box.reportPath, "utf8"), previous);
}

test("Default input produces the expected six-record summary", async t => {
  const box = await sandbox(t);
  const run = await box.run(fixture, { useDefault: true });
  succeeded(run);
  const report = await box.report();
  assert.deepEqual(report.summary, {
    totalRecords: 6, inspectedRecords: 5, unavailableRecords: 1,
    recordsWithFindings: 2, recordsWithoutPasswordForms: 2,
    unassociatedPasswordFields: 1
  });
  assert.equal(report.results.length, 6);
  assert.equal(report.source, "synthetic");
  assert.match(run.stdout, /NOT DETECTION ACCURACY/);
});

test("Unavailable inspection remains distinct from zero forms", async t => {
  const box = await sandbox(t);
  succeeded(await box.run());
  const { results } = await box.report();
  const unavailable = results.find(row => row.id === "restricted-page");
  const empty = results.find(row => row.id === "no-password-forms");
  assert.equal(unavailable.status, "unavailable");
  assert.equal(unavailable.passwordForms, null);
  assert.equal(unavailable.findingIds, null);
  assert.equal(unavailable.analysis, null);
  assert.equal(empty.status, "inspected");
  assert.equal(empty.passwordForms, 0);
  assert.deepEqual(empty.findingIds, []);
});

test("Button findings are retained and repeated finding IDs are deduplicated", async t => {
  const box = await sandbox(t);
  const input = structuredClone(fixture);
  input.records = [input.records.find(row => row.id === "external-http")];
  input.records[0].snapshot.forms[0].submitterActions = [{
    action: "http://another.example.org/session", method: null, disabled: false
  }];
  succeeded(await box.run(input));
  const report = await box.report();
  const result = report.results[0];
  assert.deepEqual(result.findingIds, ["FORM-CROSS-SITE", "FORM-HTTP"]);
  assert.equal(result.analysis.results[0].submitterResults[0].findings.length, 2);
  assert.equal(report.summary.recordsWithFindings, 1);
});

test("Report excludes raw page URLs, action paths and query tokens", async t => {
  const box = await sandbox(t);
  const input = structuredClone(fixture);
  input.records = [input.records[0]];
  input.records[0].snapshot.pageUrl = "https://portal.example.com/private-page?token=page-secret";
  input.records[0].snapshot.baseUrl = input.records[0].snapshot.pageUrl;
  input.records[0].snapshot.forms[0].action = "https://collector.example.net/private-action?token=action-secret";
  succeeded(await box.run(input));
  const contents = await readFile(box.reportPath, "utf8");
  for (const text of ["private-page", "page-secret", "private-action", "action-secret", '"snapshot"']) {
    assert.ok(!contents.includes(text), `Report unexpectedly contains ${text}`);
  }
  assert.match(contents, /FORM-CROSS-SITE/);
});

test("Malformed JSON fails and preserves the preceding report", async t => {
  await rejectsWithoutOverwriting(t, () => {}, null, "{ invalid JSON");
});

test("Duplicate record IDs fail and preserve the preceding report", async t => {
  await rejectsWithoutOverwriting(t, input => {
    input.records[1].id = input.records[0].id;
  }, /duplicate id/);
});

test("Negative field counts fail and preserve the preceding report", async t => {
  await rejectsWithoutOverwriting(t, input => {
    input.records[0].snapshot.unassociatedPasswordFields = -1;
  }, /non-negative integer/);
});

test("Unsupported dataset sources fail and preserve the preceding report", async t => {
  await rejectsWithoutOverwriting(t, input => {
    input.source = "real-world";
  }, /synthetic examples only/);
});

test("Unavailable records cannot contain a snapshot", async t => {
  await rejectsWithoutOverwriting(t, input => {
    input.records.at(-1).snapshot = input.records[0].snapshot;
  }, /must not include a snapshot/);
});

test("An invalid final record cannot produce a partial report", async t => {
  await rejectsWithoutOverwriting(t, input => {
    input.records.push({
      id: "invalid-final-record", inspectionStatus: "available",
      snapshot: {
        pageUrl: "https://portal.example.com/login",
        baseUrl: "https://portal.example.com/login",
        unassociatedPasswordFields: 0,
        forms: [{ hasPasswordField: true, action: 123, method: "post", submitterActions: [] }]
      }
    });
  }, /Form action must be a string or null/);
});
