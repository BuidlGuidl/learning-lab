// Node 22+ exposes a global `localStorage`, but unless the process was started
// with a valid --localstorage-file it's a stub with no getItem. Libraries that
// feature-detect storage by existence (RainbowKit's getRecentWalletIds, among
// others) then call into it during SSR and throw
// "localStorage.getItem is not a function", taking down every route.
//
// The server has no business reading browser storage, so drop the broken global
// before any app code sees it. Deployment runtimes on older Node never define
// it, and this is a no-op there.
export function register() {
  if (process.env.NEXT_RUNTIME !== "nodejs") return;
  const storage = (globalThis as { localStorage?: { getItem?: unknown } }).localStorage;
  if (storage && typeof storage.getItem !== "function") {
    delete (globalThis as { localStorage?: unknown }).localStorage;
  }
}
