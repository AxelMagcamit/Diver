import { getSiteIdentity } from "./site-identity.js";

export const REPUTATION_SOURCE = "MetaMask eth-phishing-detect";
export const REPUTATION_FEED =
  "https://raw.githubusercontent.com/MetaMask/eth-phishing-detect/main/src/config.json";
const KEY = "diver-reputation-v1";
const REFRESH = 12 * 60 * 60 * 1000;
const EXPIRES = 24 * 60 * 60 * 1000;
const RETRY = 15 * 60 * 1000;
const LIMIT = 8 * 1024 * 1024;
let cached;
let pending;
let loaded = false;
let retryAt = 0;

function domain(value) {
  if (typeof value !== "string") throw new TypeError("Invalid feed entry.");
  // Ignore path-based entries rather than blocking their entire host.
  if (!value || value.length > 253 || /[\s/:@?#%*\\]/.test(value)) return null;
  const identity = getSiteIdentity(`https://${value}`);
  return identity?.label === "Site domain" ? identity.hostname : null;
}

function compile(blocklist, allowlist, fetchedAt) {
  if (!Array.isArray(blocklist) || !Array.isArray(allowlist) ||
      blocklist.length === 0 || blocklist.length + allowlist.length > 200000 ||
      !Number.isFinite(fetchedAt)) {
    throw new TypeError("Invalid reputation snapshot.");
  }
  const blocked = new Set(blocklist.map(domain).filter(Boolean));
  const allowed = new Set(allowlist.map(domain).filter(Boolean));
  if (blocked.size === 0) throw new TypeError("Empty domain list.");
  return { blocked, allowed, fetchedAt };
}

async function download() {
  const controller = new AbortController();
  const timer = setTimeout(() => controller.abort(), 15000);
  try {
    const response = await fetch(REPUTATION_FEED, {
      signal: controller.signal,
      credentials: "omit",
      referrerPolicy: "no-referrer",
      cache: "no-store"
    });
    if (!response.ok || !response.body) throw new Error("Feed unavailable.");
    const reader = response.body.getReader();
    const decoder = new TextDecoder();
    let size = 0;
    let text = "";
    try {
      while (true) {
        const { done, value } = await reader.read();
        if (done) break;
        size += value.byteLength;
        if (size > LIMIT) throw new Error("Feed is too large.");
        text += decoder.decode(value, { stream: true });
      }
      text += decoder.decode();
    } catch (error) {
      await reader.cancel().catch(() => {});
      throw error;
    }
    const feed = JSON.parse(text);
    if (feed.version !== 2) throw new Error("Unsupported feed format.");
    const next = compile(feed.blacklist, feed.whitelist, Date.now());
    await chrome.storage.local.set({
      [KEY]: {
        blocklist: [...next.blocked],
        allowlist: [...next.allowed],
        fetchedAt: next.fetchedAt
      }
    });
    cached = next;
    retryAt = 0;
  } finally {
    clearTimeout(timer);
  }
}

async function prepare() {
  if (pending) return pending;
  pending = (async () => {
    if (!loaded) {
      loaded = true;
      try {
        const stored = (await chrome.storage.local.get(KEY))[KEY];
        if (stored) cached = compile(stored.blocklist, stored.allowlist, stored.fetchedAt);
      } catch { cached = undefined; }
    }
    const age = cached ? Date.now() - cached.fetchedAt : Infinity;
    if ((age < 0 || age >= REFRESH) && Date.now() >= retryAt) {
      try { await download(); }
      catch { retryAt = Date.now() + RETRY; }
    }
  })().finally(() => { pending = undefined; });
  return pending;
}

export async function checkReputation(rawUrl, { waitForRefresh = true } = {}) {
  let url;
  try { url = new URL(rawUrl); }
  catch { return { status: "unsupported", source: REPUTATION_SOURCE }; }
  if (!["http:", "https:"].includes(url.protocol)) {
    return { status: "unsupported", source: REPUTATION_SOURCE };
  }
  if (waitForRefresh) await prepare();
  else void prepare();
  const hostname = url.hostname.toLowerCase().replace(/\.+$/, "");
  const age = cached ? Date.now() - cached.fetchedAt : Infinity;
  if (age < 0 || age >= EXPIRES) {
    return { status: "unavailable", source: REPUTATION_SOURCE };
  }
  return {
    status: cached.blocked.has(hostname) && !cached.allowed.has(hostname)
      ? "listed" : "not-listed",
    source: REPUTATION_SOURCE,
    hostname,
    fetchedAt: cached.fetchedAt,
    refreshDelayed: age >= REFRESH
  };
}
