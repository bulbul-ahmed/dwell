type Listener = (data: string) => void;

const userSubs = new Map<number, Set<Listener>>();

export function subscribeUser(userId: number, fn: Listener): () => void {
  if (!userSubs.has(userId)) userSubs.set(userId, new Set());
  userSubs.get(userId)!.add(fn);
  return () => userSubs.get(userId)?.delete(fn);
}

export function publishUser(userId: number, event: { kind: string; [k: string]: unknown }): void {
  userSubs.get(userId)?.forEach(fn => {
    try { fn(JSON.stringify(event)); } catch {}
  });
}
