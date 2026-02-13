const ACTIVE_WINDOW_MS = 45_000;

type ProductPresenceStore = Map<string, Map<string, number>>;

declare global {
  // eslint-disable-next-line no-var
  var __qbProductPresenceStore: ProductPresenceStore | undefined;
}

function store(): ProductPresenceStore {
  if (!globalThis.__qbProductPresenceStore) {
    globalThis.__qbProductPresenceStore = new Map();
  }
  return globalThis.__qbProductPresenceStore;
}

export function touchProductViewer(productId: string, viewerId: string) {
  const now = Date.now();
  const s = store();
  const viewers = s.get(productId) ?? new Map<string, number>();
  viewers.set(viewerId, now);
  s.set(productId, viewers);
  pruneProductViewers(productId, now);
}

export function leaveProductViewer(productId: string, viewerId: string) {
  const s = store();
  const viewers = s.get(productId);
  if (!viewers) return;
  viewers.delete(viewerId);
  if (viewers.size === 0) {
    s.delete(productId);
  }
}

export function getActiveViewerCount(productId: string) {
  const now = Date.now();
  pruneProductViewers(productId, now);
  const viewers = store().get(productId);
  return viewers ? viewers.size : 0;
}

function pruneProductViewers(productId: string, now: number) {
  const s = store();
  const viewers = s.get(productId);
  if (!viewers) return;

  for (const [viewerId, ts] of viewers.entries()) {
    if (now - ts > ACTIVE_WINDOW_MS) {
      viewers.delete(viewerId);
    }
  }

  if (viewers.size === 0) {
    s.delete(productId);
  } else {
    s.set(productId, viewers);
  }
}
