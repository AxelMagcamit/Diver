// These functions run in Chrome's isolated page world. Keep them self-contained:
// executeScript serializes the function without its module closure.
export function claimWarning(expectedUrl, token) {
  if (document.URL !== expectedUrl) return false;
  const url = new URL(expectedUrl);
  url.hash = "";
  const key = url.href;
  const state = globalThis.__diverWarningState ??= {};
  if (state.warningClaim?.url === key) return false;
  state.warningClaim = { url: key, token };
  return true;
}

export function releaseWarning(token) {
  const state = globalThis.__diverWarningState;
  // A failed older scan must not release a newer destination's warning.
  if (state?.warningClaim?.token === token) delete state.warningClaim;
}
