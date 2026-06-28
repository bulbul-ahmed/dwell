// Shared listing helpers — availability label + freshness. Previously duplicated
// across ListingCard, QuickView and DetailClient (the availability logic 5×).

const AVAIL_NOW = { label: 'Available now', color: '#1E6B3A', bg: '#E8F5EE' };

/** Whole days since a createdAt timestamp (null if missing). */
export function daysSince(createdAt?: string | null): number | null {
  if (!createdAt) return null;
  const t = new Date(createdAt).getTime();
  if (isNaN(t)) return null;
  return Math.floor((Date.now() - t) / 86400000);
}

/** "New" = posted within the last 7 days. */
export function isNew(createdAt?: string | null): boolean {
  const d = daysSince(createdAt);
  return d !== null && d <= 7;
}

/**
 * Availability label + colors.
 * "Available now" (green) when immediate/past/empty, else "Available {Mon D}" (amber).
 */
export function fmtAvail(availableFrom?: string | null): { label: string; color: string; bg: string } {
  if (!availableFrom || availableFrom === 'immediate') return AVAIL_NOW;
  const d = new Date(availableFrom);
  if (isNaN(d.getTime())) return AVAIL_NOW;
  const today = new Date();
  today.setHours(0, 0, 0, 0);
  if (d <= today) return AVAIL_NOW;
  const label = `Available ${d.toLocaleDateString('en', { day: 'numeric', month: 'short' })}`;
  return { label, color: '#7A5A12', bg: '#FEF3CD' };
}
