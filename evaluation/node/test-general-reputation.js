import test from "node:test";
import assert from "node:assert/strict";
import { combineReputationChecks } from "../../extension/engine/hybrid-reputation.js";
import { getAutomaticWarning } from "../../extension/engine/warning-policy.js";

let sequence = 0;
const HOUR = 3600000;
async function fixture(run, options = {}) {
  const original = { fetch: globalThis.fetch, chrome: globalThis.chrome, now: Date.now };
  const state = { now: original.now(), calls: [], stored: options.stored ?? {}, mode: "ok", body: null };
  Date.now = () => state.now;
  globalThis.chrome = { storage: { local: {
    get: async key => ({ [key]: state.stored[key] }),
    set: async value => { if (state.mode === "quota") throw Error("Quota"); Object.assign(state.stored, value); }
  } } };
  globalThis.fetch = async (url, settings) => {
    state.calls.push({ url, settings });
    if (state.mode === "offline") throw Error("Offline");
    if (state.mode === "oversized") return new Response(new Uint8Array(8 * 1024 * 1024 + 1));
    return new Response(state.body ?? `# Updated: ${new Date(state.now).toISOString()}\n0.0.0.0 reported.example.test\n0.0.0.0 sites.google.com\n0.0.0.0 192.0.2.1\n`);
  };
  try {
    const module = await import(`../../extension/engine/general-reputation.js?test=${sequence++}`);
    await run(module, state);
  } finally { globalThis.fetch = original.fetch; globalThis.chrome = original.chrome; Date.now = original.now; }
}

test("General source normalizes exact host matches and never uploads private page URLs", async () => {
  await fixture(async ({ checkGeneralReputation, GENERAL_FEED }, state) => {
    const result = await checkGeneralReputation("https://REPORTED.example.test./login?private=secret");
    assert.equal(result.status, "listed");
    assert.equal(state.calls[0].url, GENERAL_FEED);
    assert.equal(state.calls[0].settings.credentials, "omit");
    assert.equal(state.calls[0].settings.referrerPolicy, "no-referrer");
    assert.equal(JSON.stringify(state.stored).includes("private=secret"), false);
    for (const url of ["https://sub.reported.example.test/", "https://reported.example.test.attacker.test/", "https://sites.google.com/", "https://192.0.2.1/"]) {
      assert.equal((await checkGeneralReputation(url)).status, "not-listed");
    }
  });
});

test("Unsupported inputs do not initiate a source download", async () => {
  await fixture(async ({ checkGeneralReputation }, state) => {
    for (const url of ["not a URL", "chrome://settings/", "file:///tmp/test"]) assert.equal((await checkGeneralReputation(url)).status, "unsupported");
    assert.equal(state.calls.length, 0);
  });
});

test("Concurrent checks share one download", async () => {
  await fixture(async ({ checkGeneralReputation }, state) => {
    const results = await Promise.all(Array.from({ length: 8 }, () => checkGeneralReputation("https://reported.example.test/")));
    assert.equal(results.every(result => result.status === "listed"), true);
    assert.equal(state.calls.length, 1);
  });
});

test("Fresh caches work offline; expired source timestamps stop matches despite recent downloads", async () => {
  await fixture(async ({ checkGeneralReputation }, state) => {
    await checkGeneralReputation("https://reported.example.test/");
    state.mode = "offline";
    state.now += 13 * HOUR;
    assert.equal((await checkGeneralReputation("https://reported.example.test/")).refreshDelayed, true);
    state.now += 11 * HOUR;
    assert.equal((await checkGeneralReputation("https://reported.example.test/")).status, "unavailable");
  });
  await fixture(async ({ checkGeneralReputation }, state) => {
    state.mode = "offline";
    assert.equal((await checkGeneralReputation("https://reported.example.test/")).status, "unavailable");
  }, { stored: { "diver-general-reputation-v1": {
    domains: ["reported.example.test"], fetchedAt: Date.now(), sourceUpdatedAt: Date.now() - 25 * HOUR
  } } });
});

test("Empty, HTML, stale and future source bodies fail explicitly", async () => {
  for (const body of ["", "<html>Error</html>", `# Updated: ${new Date(Date.now() - 25 * HOUR).toISOString()}\n0.0.0.0 reported.example.test`, `# Updated: ${new Date(Date.now() + HOUR).toISOString()}\n0.0.0.0 reported.example.test`]) {
    await fixture(async ({ checkGeneralReputation }, state) => {
      state.body = body;
      assert.equal((await checkGeneralReputation("https://reported.example.test/")).status, "unavailable");
      assert.equal(Object.keys(state.stored).length, 0);
    });
  }
});

test("Oversized bodies and storage quota failures do not activate an incomplete source", async () => {
  for (const mode of ["oversized", "quota"]) await fixture(async ({ checkGeneralReputation }, state) => {
    state.mode = mode;
    assert.equal((await checkGeneralReputation("https://reported.example.test/")).status, "unavailable");
  });
});

test("Failed refresh preserves usable data and backs off repeat requests", async () => {
  await fixture(async ({ checkGeneralReputation }, state) => {
    await checkGeneralReputation("https://reported.example.test/");
    const preceding = JSON.stringify(state.stored);
    state.now += 13 * HOUR;
    state.body = "broken";
    assert.equal((await checkGeneralReputation("https://reported.example.test/")).status, "listed");
    assert.equal(JSON.stringify(state.stored), preceding);
    await checkGeneralReputation("https://reported.example.test/");
    assert.equal(state.calls.length, 2);
  });
});

test("One source match still warns if another source is unavailable or has an allowlist exception", () => {
  for (const status of ["unavailable", "not-listed"]) {
    const result = combineReputationChecks([
      { status, source: "MetaMask eth-phishing-detect" },
      { status: "listed", source: "Phishing URL Blocklist (malware-filter)" }
    ]);
    assert.equal(result.status, "listed");
    const warning = getAutomaticWarning(null, null, result);
    assert.equal(warning.warn, true);
    assert.match(warning.reasons[0], /malware-filter/);
  }
});

test("Partial no-match coverage is unavailable rather than a complete negative", () => {
  assert.equal(combineReputationChecks([{ status: "not-listed" }, { status: "unavailable" }]).status, "unavailable");
  assert.equal(combineReputationChecks([{ status: "not-listed" }, { status: "not-listed" }]).status, "not-listed");
});

test("Future-dated stored snapshots request replacement instead of stalling the cache", async () => {
  await fixture(async ({ checkGeneralReputation }, state) => {
    assert.equal((await checkGeneralReputation("https://reported.example.test/")).status, "listed");
    assert.equal(state.calls.length, 1);
    assert.equal(state.stored["diver-general-reputation-v1"].fetchedAt, state.now);
  }, { stored: { "diver-general-reputation-v1": {
    domains: ["reported.example.test"], fetchedAt: Date.now() + HOUR, sourceUpdatedAt: Date.now()
  } } });
});
