// Quick date ranges for the events filters (no imports on purpose, unit-tested with node --test).
// Baku is UTC+4 all year, so "today" is the Baku date.
export type Quick = "any" | "today" | "weekend" | "week";
const BAKU_OFFSET_MS = 4 * 3600 * 1000;
const DAY = 86400000;
const pad = (n: number) => String(n).padStart(2, "0");
const iso = (d: Date) =>
  d.getUTCFullYear() + "-" + pad(d.getUTCMonth() + 1) + "-" + pad(d.getUTCDate());

/** The Baku calendar day of an instant, as a date at UTC midnight so day arithmetic is simple. */
function bakuDay(now: number) {
  const d = new Date(now + BAKU_OFFSET_MS);
  return new Date(Date.UTC(d.getUTCFullYear(), d.getUTCMonth(), d.getUTCDate()));
}

/**
 * Plain dates the events API understands (`from` is that day's start, `to` is the end of that day).
 * Weekend means Saturday and Sunday; on a Saturday or Sunday it starts today.
 */
export function quickRange(
  kind: Quick,
  now = Date.now(),
): { from: string; to: string } | null {
  if (kind === "any") return null;
  const today = bakuDay(now);
  if (kind === "today") return { from: iso(today), to: iso(today) };
  if (kind === "week")
    return { from: iso(today), to: iso(new Date(today.getTime() + 6 * DAY)) };
  const weekday = today.getUTCDay(); // 0 Sunday ... 6 Saturday
  if (weekday === 0) return { from: iso(today), to: iso(today) };
  const saturday =
    weekday === 6
      ? today
      : new Date(today.getTime() + (6 - weekday) * DAY);
  return { from: iso(saturday), to: iso(new Date(saturday.getTime() + DAY)) };
}
