import { parse } from 'tldts';
// Narrow experiment: paypal.com embedded before a different registrable domain.
// Not an ownership verification service or a general brand detector.
export function embeddedDomainSignal(rawUrl) {
  let url;
  try { url = new URL(rawUrl); } catch { return false; }
  if (!['http:', 'https:'].includes(url.protocol)) return false;
  const host = url.hostname.toLowerCase().replace(/\.+$/, '');
  if (!/(?:^|\.)paypal\.com\./.test(host)) return false;
  const domain = parse(host, { allowPrivateDomains: true }).domain;
  return Boolean(domain && domain !== 'paypal.com');
}
