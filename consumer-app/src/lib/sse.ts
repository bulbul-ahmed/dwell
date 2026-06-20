// In-memory pub/sub for SSE message broadcasting.
// One Set of listeners per thread ID. Works for single-process Node (dev + production on a single server).
type Listener = (data: string) => void;

const subs = new Map<number, Set<Listener>>();

export function subscribe(threadId: number, fn: Listener): () => void {
  if (!subs.has(threadId)) subs.set(threadId, new Set());
  subs.get(threadId)!.add(fn);
  return () => subs.get(threadId)?.delete(fn);
}

export function publish(threadId: number, data: object): void {
  subs.get(threadId)?.forEach(fn => {
    try { fn(JSON.stringify(data)); } catch { /* stream already closed */ }
  });
}
