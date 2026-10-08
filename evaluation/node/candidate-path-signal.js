// Experimental only: never imported by the browser extension.
export function credentialPathSignal(rawUrl) {
  let url;
  try { url = new URL(rawUrl); } catch { return false; }
  if (!['http:', 'https:'].includes(url.protocol)) return false;
  let path = url.pathname;
  try { path = decodeURIComponent(path); } catch { /* Preserve malformed escapes. */ }
  return /(?:^|[^a-z0-9])(?:login|signin|sign-in|verify|verification|password)(?=$|[^a-z0-9])/i.test(path);
}
