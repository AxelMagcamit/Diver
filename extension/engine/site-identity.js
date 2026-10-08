import { parse } from '../vendor/tldts-7.4.16.js';

// Same private-suffix policy as the evaluation domain grouping. No network calls.
export function getSiteIdentity(rawUrl) {
  let url;
  try { url = new URL(rawUrl); } catch { return null; }
  if (!['http:', 'https:'].includes(url.protocol)) return null;
  const hostname = url.hostname.toLowerCase().replace(/\.+$/, '');
  const parsed = parse(hostname, { allowPrivateDomains: true });
  if (parsed.isIp) return { label: 'IP address', value: hostname, hostname };
  return { label: parsed.domain ? 'Site domain' : 'Hostname', value: parsed.domain || hostname, hostname };
}
