import test from "node:test";
import assert from "node:assert/strict";
import { getAutomaticWarning } from "../../extension/engine/warning-policy.js";

let sequence = 0;
const feed = {
  version: 2,
  blacklist: [
    "reported.example.test", "allowed.example.test",
    "sites.google.com/view/reported-page", "github.io"
  ],
  whitelist: ["allowed.example.test"]
};

async function fixture(run, options = {}) {
  const originalFetch = globalThis.fetch;
  const originalChrome = globalThis.chrome;
  const originalNow = Date.now;
  const state = { now: originalNow(), stored: options.stored ?? {}, calls: [], mode: "ok" };
  Date.now = () => state.now;
  globalThis.chrome = { storage: { local: {
    get: async key => ({ [key]: state.stored[key] }),
    set: async value => Object.assign(state.stored, value)
  } } };
  globalThis.fetch = async (url, settings) => {
    state.calls.push({ url, settings });
    if (state.mode === "fail") throw new Error("Simulated offline state.");
    if (state.mode === "malformed") return new Response("{broken");
    return options.response ? options.response(state) : new Response(JSON.stringify(feed));
  };
  try {
    const module = await import(`../../extension/engine/reputation.js?test=${sequence++}`);
    await run(module, state);
  } finally {
    globalThis.fetch = originalFetch;
    globalThis.chrome = originalChrome;
    Date.now = originalNow;
  }
}

test("Exact host matches normalize case and trailing dots without uploading browsing URLs", async () => {
  await fixture(async ({ checkReputation, REPUTATION_FEED }, state) => {
    const results = await Promise.all([
      checkReputation("https://REPORTED.example.test./login?private=do-not-upload"),
      checkReputation("https://reported.example.test/other")
    ]);
    assert.equal(results[0].status, "listed");
    assert.equal(results[1].status, "listed");
    assert.equal(state.calls.length, 1);
    assert.equal(state.calls[0].url, REPUTATION_FEED);
    assert.equal(state.calls[0].settings.credentials, "omit");
    assert.equal(state.calls[0].settings.referrerPolicy, "no-referrer");
    assert.equal(JSON.stringify(state.stored).includes("do-not-upload"), false);
  });
});

test("Substring, subdomain, shared-host and path-only entries do not broaden matches", async () => {
  await fixture(async ({ checkReputation }) => {
    for (const url of [
      "https://reported.example.test.other.test/",
      "https://sub.reported.example.test/",
      "https://sites.google.com/view/unrelated",
      "https://tenant.github.io/"
    ]) assert.equal((await checkReputation(url)).status, "not-listed");
  });
});

test("An allowlist exception affects reputation without overriding local rule warnings", async () => {
  await fixture(async ({ checkReputation }) => {
    const reputation = await checkReputation("https://allowed.example.test/");
    assert.equal(reputation.status, "not-listed");
    const forms = { results: [{ namedEnabledPasswordFields: 1,
      findings: [{ id: "FORM-GET" }], submitterResults: [] }] };
    assert.equal(getAutomaticWarning(null, forms, reputation).warn, true);
  });
});

test("Malformed refresh preserves a valid snapshot and failed updates have retry backoff", async () => {
  await fixture(async ({ checkReputation }, state) => {
    await checkReputation("https://reported.example.test/");
    state.now += 13 * 60 * 60 * 1000;
    state.mode = "malformed";
    const delayed = await checkReputation("https://reported.example.test/");
    assert.equal(delayed.status, "listed");
    assert.equal(delayed.refreshDelayed, true);
    assert.equal(state.calls.length, 2);
    await checkReputation("https://reported.example.test/");
    assert.equal(state.calls.length, 2);
  });
});

test("Expired snapshots and failed first downloads return unavailable rather than safe", async () => {
  await fixture(async ({ checkReputation }, state) => {
    await checkReputation("https://reported.example.test/");
    state.now += 25 * 60 * 60 * 1000;
    state.mode = "fail";
    assert.equal((await checkReputation("https://reported.example.test/")).status, "unavailable");
  });
  await fixture(async ({ checkReputation }, state) => {
    state.mode = "fail";
    assert.equal((await checkReputation("https://ordinary.example.test/")).status, "unavailable");
  });
});

test("Unsupported feed formats and excessive download sizes cannot produce matches", async () => {
  await fixture(async ({ checkReputation }) => {
    assert.equal((await checkReputation("https://reported.example.test/")).status, "unavailable");
  }, { response: () => new Response(JSON.stringify({ ...feed, version: 99 })) });
  await fixture(async ({ checkReputation }) => {
    assert.equal((await checkReputation("https://reported.example.test/")).status, "unavailable");
  }, { response: () => new Response(new Uint8Array(8 * 1024 * 1024 + 1)) });
});

test("A non-waiting check lets local warnings proceed during a pending download", async () => {
  let finish;
  const response = new Promise(resolve => { finish = resolve; });
  await fixture(async ({ checkReputation }) => {
    const initial = await checkReputation("https://ordinary.example.test/", { waitForRefresh: false });
    assert.equal(initial.status, "unavailable");
    finish(new Response(JSON.stringify(feed)));
    assert.equal((await checkReputation("https://reported.example.test/")).status, "listed");
  }, { response: () => response });
});

test("Reputation is separate evidence and does not turn an unlisted host into a safe verdict", () => {
  const url = { valid: true, supported: true, score: 0 };
  assert.equal(getAutomaticWarning(url, null, { status: "listed" }).warn, true);
  assert.equal(getAutomaticWarning(url, null, { status: "not-listed" }).warn, false);
  assert.equal(getAutomaticWarning(url, null, { status: "unavailable" }).warn, false);
  assert.equal(url.score, 0);
});
