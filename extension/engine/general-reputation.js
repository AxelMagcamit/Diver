import { getSiteIdentity } from "./site-identity.js";

export const GENERAL_SOURCE = "Phishing URL Blocklist (malware-filter)";
export const GENERAL_FEED = "https://malware-filter.gitlab.io/malware-filter/phishing-filter-hosts.txt";
const KEY = "diver-general-reputation-v1";
const REFRESH = 12 * 60 * 60 * 1000;
const EXPIRES = 24 * 60 * 60 * 1000;
const RETRY = 15 * 60 * 1000;
const LIMIT = 8 * 1024 * 1024;
const ENTRY_LIMIT = 200000;
// A host-only report cannot identify an individual page on these shared services.
const SHARED_HOSTS = new Set([
  "github.io", "pages.dev", "web.app", "firebaseapp.com", "vercel.app",
  "netlify.app", "sites.google.com", "docs.google.com", "drive.google.com",
  "forms.gle", "bit.ly", "tinyurl.com", "t.co"
]);
let cached, pending;
let loaded = false;
let retryAt = 0;

function normalizeDomain(value) {
  if (typeof value !== "string" || !value || value.length > 253 || /[\s/:@?#%*\\]/.test(value)) {
    throw new TypeError("Malformed general reputation entry.");
  }
  const identity = getSiteIdentity(`https://${value}`);
  if (identity?.label !== "Site domain") return null;
  return identity.hostname;
}

function compile(domains, fetchedAt, sourceUpdatedAt) {
  if (!Array.isArray(domains) || !domains.length || domains.length > ENTRY_LIMIT || !Number.isFinite(fetchedAt) || !Number.isFinite(sourceUpdatedAt)) {
    throw new TypeError("Invalid general reputation snapshot.");
  }
  const blocked = new Set(domains.map(normalizeDomain).filter(host => host && !SHARED_HOSTS.has(host)));
  if (!blocked.size) throw new TypeError("Empty general reputation snapshot.");
  return { blocked, fetchedAt, sourceUpdatedAt };
}

export function parseGeneralFeed(text) {
  const domains = [];
  const timestamp = text.match(/^# Updated: (.+)$/m)?.[1]?.trim();
  const sourceUpdatedAt = Date.parse(timestamp);
  if (!Number.isFinite(sourceUpdatedAt) || sourceUpdatedAt > Date.now() + 300000 || Date.now() - sourceUpdatedAt >= EXPIRES) throw new Error('General reputation feed is stale or undated.');
  const lines = text.split(/\r?\n/);
  if (lines.length > ENTRY_LIMIT + 1000) throw new Error("Too many feed lines.");
  for (const raw of lines) {
    const line = raw.replace(/#.*/, "").trim();
    if (!line) continue;
    const parts = line.split(/\s+/);
    // Accept only the documented hosts format, not HTML/error responses.
    if (parts.length !== 2 || !["0.0.0.0", "127.0.0.1"].includes(parts[0])) {
      throw new TypeError("Unexpected general reputation format.");
    }
    if (["localhost", "localhost.localdomain", "broadcasthost"].includes(parts[1].toLowerCase())) continue;
    const domain = normalizeDomain(parts[1]);
    if (domain) domains.push(domain);
  }
  return compile(domains, Date.now(), sourceUpdatedAt);
}

async function download() {
  const controller = new AbortController();
  const timer = setTimeout(() => controller.abort(), 15000);
  try {
    const response = await fetch(GENERAL_FEED, {
      signal: controller.signal, credentials: "omit", referrerPolicy: "no-referrer", cache: "no-store"
    });
    if (!response.ok || !response.body) throw new Error("General reputation unavailable.");
    const reader = response.body.getReader();
    const decoder = new TextDecoder();
    let bytes = 0, text = "";
    try {
      while (true) {
        const { done, value } = await reader.read();
        if (done) break;
        bytes += value.byteLength;
        if (bytes > LIMIT) throw new Error("General reputation feed too large.");
        text += decoder.decode(value, { stream: true });
      }
      text += decoder.decode();
    } catch (error) {
      await reader.cancel().catch(() => {});
      throw error;
    }
    const next = parseGeneralFeed(text);
    // Activate only after persistence succeeds; quota failures remain explicit.
    await chrome.storage.local.set({ [KEY]: { domains: [...next.blocked], fetchedAt: next.fetchedAt, sourceUpdatedAt: next.sourceUpdatedAt } });
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
        if (stored) cached = compile(stored.domains, stored.fetchedAt, stored.sourceUpdatedAt);
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

export async function checkGeneralReputation(rawUrl, { waitForRefresh = true } = {}) {
  let url;
  try { url = new URL(rawUrl); }
  catch { return { status: "unsupported", source: GENERAL_SOURCE }; }
  if (!["http:", "https:"].includes(url.protocol)) return { status: "unsupported", source: GENERAL_SOURCE };
  if (waitForRefresh) await prepare();
  else void prepare();
  const age = cached ? Math.max(Date.now() - cached.fetchedAt, Date.now() - cached.sourceUpdatedAt) : Infinity;
  if (age < 0 || age >= EXPIRES || cached?.fetchedAt > Date.now() || cached?.sourceUpdatedAt > Date.now() + 300000) return { status: "unavailable", source: GENERAL_SOURCE };
  const hostname = url.hostname.toLowerCase().replace(/\.+$/, "");
  return { status: cached.blocked.has(hostname) ? "listed" : "not-listed", source: GENERAL_SOURCE,
    hostname, fetchedAt: cached.fetchedAt, sourceUpdatedAt: cached.sourceUpdatedAt, refreshDelayed: age >= REFRESH };
}
