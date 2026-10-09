import { getSiteIdentity } from "./site-identity.js";

export const PAGE_SOURCE = "Phishing URL Blocklist pages (malware-filter)";
export const PAGE_FEED = "https://malware-filter.gitlab.io/malware-filter/phishing-filter-vivaldi.txt";
const KEY = "diver-page-reputation-v1";
const REFRESH = 12 * 60 * 60 * 1000;
const EXPIRES = 24 * 60 * 60 * 1000;
const RETRY = 15 * 60 * 1000;
const LIMIT = 8 * 1024 * 1024;
const ENTRY_LIMIT = 200000;
let cached, pending;
let loaded = false;
let retryAt = 0;

function compile(entries, fetchedAt, sourceUpdatedAt, skippedRules = 0) {
  if (!Array.isArray(entries) || !entries.length || entries.length > ENTRY_LIMIT ||
      !Number.isFinite(fetchedAt) || !Number.isFinite(sourceUpdatedAt) ||
      !Number.isSafeInteger(skippedRules) || skippedRules < 0) throw Error("Invalid page snapshot.");
  const indexed = new Map();
  for (const entry of entries) {
    if (!Array.isArray(entry) || entry.length !== 2) throw Error("Invalid page entry.");
    const [host, path] = entry;
    if (typeof host !== "string" || typeof path !== "string" || path.length > 4096 ||
        !path.startsWith("/") || /[\s*^|#\\]/.test(path) || /[\s/:@?#%*\\]/.test(host)) throw Error("Invalid page entry.");
    const identity = getSiteIdentity("https://" + host);
    if (identity?.label !== "Site domain" || identity.hostname !== host || path === "/") throw Error("Invalid page entry.");
    // Case-sensitive, literal URL serialization; no decoding or fuzzy matching.
    if (new URL("https://" + host + path).pathname + new URL("https://" + host + path).search !== path) throw Error("Noncanonical page entry.");
    if (!indexed.has(host)) indexed.set(host, new Set());
    indexed.get(host).add(path);
  }
  return { indexed, entries: [...indexed].flatMap(([host, paths]) => [...paths].map(path => [host, path])), fetchedAt, sourceUpdatedAt, skippedRules };
}

export function parsePageFeed(text) {
  const sourceUpdatedAt = Date.parse(text.match(/^! Updated: (.+)$/m)?.[1]?.trim());
  if (!Number.isFinite(sourceUpdatedAt) || sourceUpdatedAt > Date.now() + 300000 || Date.now() - sourceUpdatedAt >= EXPIRES) throw Error("Page feed is stale or undated.");
  const lines = text.split(/\r?\n/);
  if (lines.length > ENTRY_LIMIT + 1000) throw Error("Too many page rules.");
  const entries = [];
  let skippedRules = 0;
  for (const raw of lines) {
    const line = raw.trim();
    if (!line || line.startsWith("!")) continue;
    // This is a conservative subset of the publisher's Vivaldi document rules,
    // not a general Adblock parser. Exceptions/format changes invalidate refresh.
    const match = line.match(/^\|\|([^/]+)(\/.*)?\^\$document$/);
    if (!match) throw Error("Unexpected page feed format.");
    if (!match[2]) continue; // Host-only rules belong to the existing host source.
    try {
      const entry = compile([[match[1], match[2]]], Date.now(), sourceUpdatedAt);
      entries.push(entry.entries[0]);
    } catch { skippedRules++; }
  }
  return compile(entries, Date.now(), sourceUpdatedAt, skippedRules);
}

export function pageIsListed(snapshot, rawUrl) {
  const url = new URL(rawUrl);
  if (!["http:", "https:"].includes(url.protocol) || url.port) return false;
  const paths = snapshot.indexed.get(url.hostname.toLowerCase().replace(/\.+$/, ""));
  if (!paths) return false;
  const candidate = url.pathname + url.search;
  for (const path of paths) {
    if (!candidate.startsWith(path)) continue;
    const next = candidate.slice(path.length, path.length + 1);
    // ABP ^ means separator or end, not an arbitrary suffix. Fragment excluded.
    if (!next || /[^A-Za-z0-9_.%\-]/.test(next)) return true;
  }
  return false;
}

async function download() {
  const controller = new AbortController();
  const timer = setTimeout(() => controller.abort(), 15000);
  try {
    const response = await fetch(PAGE_FEED, {
      signal: controller.signal, credentials: "omit", referrerPolicy: "no-referrer", cache: "no-store"
    });
    if (!response.ok || !response.body) throw new Error("Page reputation unavailable.");
    const reader = response.body.getReader();
    const decoder = new TextDecoder();
    let bytes = 0, text = "";
    try {
      while (true) {
        const { done, value } = await reader.read();
        if (done) break;
        bytes += value.byteLength;
        if (bytes > LIMIT) throw new Error("Page reputation feed too large.");
        text += decoder.decode(value, { stream: true });
      }
      text += decoder.decode();
    } catch (error) {
      await reader.cancel().catch(() => {});
      throw error;
    }
    const next = parsePageFeed(text);
    // Activate only after persistence succeeds; quota failures remain explicit.
    await chrome.storage.local.set({ [KEY]: { entries: next.entries, skippedRules: next.skippedRules, fetchedAt: next.fetchedAt, sourceUpdatedAt: next.sourceUpdatedAt } });
    cached = next;
    retryAt = 0;
  } finally { clearTimeout(timer); }
}

async function prepare() {
  if (pending) return pending;
  pending = (async () => {
    if (!loaded) {
      loaded = true;
      try {
        const stored = (await chrome.storage.local.get(KEY))[KEY];
        if (stored) cached = compile(stored.entries, stored.fetchedAt, stored.sourceUpdatedAt, stored.skippedRules);
      } catch { cached = undefined; }
    }
    const age = cached ? Math.max(Date.now() - cached.fetchedAt, Date.now() - cached.sourceUpdatedAt) : Infinity;
    if ((age < 0 || age >= REFRESH || cached?.fetchedAt > Date.now() || cached?.sourceUpdatedAt > Date.now() + 300000) && Date.now() >= retryAt) {
      try { await download(); }
      catch { retryAt = Date.now() + RETRY; }
    }
  })().finally(() => { pending = undefined; });
  return pending;
}

export async function checkPageReputation(rawUrl, { waitForRefresh = true } = {}) {
  let url;
  try { url = new URL(rawUrl); }
  catch { return { status: "unsupported", source: PAGE_SOURCE, matchType: "page" }; }
  if (!["http:", "https:"].includes(url.protocol)) return { status: "unsupported", source: PAGE_SOURCE, matchType: "page" };
  if (waitForRefresh) await prepare();
  else void prepare();
  const age = cached ? Math.max(Date.now() - cached.fetchedAt, Date.now() - cached.sourceUpdatedAt) : Infinity;
  if (age < 0 || age >= EXPIRES || cached?.fetchedAt > Date.now() || cached?.sourceUpdatedAt > Date.now() + 300000) return { status: "unavailable", source: PAGE_SOURCE, matchType: "page" };
  const hostname = url.hostname.toLowerCase().replace(/\.+$/, "");
  return { status: pageIsListed(cached, rawUrl) ? "listed" : "not-listed", source: PAGE_SOURCE, matchType: "page",
    hostname, skippedRules: cached.skippedRules, fetchedAt: cached.fetchedAt, sourceUpdatedAt: cached.sourceUpdatedAt, refreshDelayed: age >= REFRESH };
}
