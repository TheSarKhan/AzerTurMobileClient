// Pure helpers for the notification screen (no imports, unit-tested with node --test).
// Baku is UTC+4 all year, so days are Baku days.
export type Tone = "ink" | "accent" | "good" | "danger";
const BAKU_OFFSET_MS = 4 * 3600 * 1000;
const DAY = 86400000;

/** The icon (an Ionicons name) and colour family for each kind of update. */
export function noticeMeta(event: string): { icon: string; tone: Tone } {
  if (event === "OFFER_SENT") return { icon: "pricetag-outline", tone: "accent" };
  if (event === "CONTRACT_SENT")
    return { icon: "document-text-outline", tone: "ink" };
  if (event === "PAYMENT_REQUESTED") return { icon: "card-outline", tone: "accent" };
  if (event === "PAYMENT_RECEIVED")
    return { icon: "checkmark-circle-outline", tone: "good" };
  if (event === "REVISED_PLAN_SENT")
    return { icon: "calendar-outline", tone: "ink" };
  if (event === "AMENDMENT_DECLINED")
    return { icon: "close-circle-outline", tone: "danger" };
  if (event === "AMENDMENT_ACCEPTED")
    return { icon: "checkmark-done-outline", tone: "good" };
  if (event.includes("AMENDMENT"))
    return { icon: "swap-horizontal-outline", tone: "accent" };
  if (event.includes("REFUND")) return { icon: "cash-outline", tone: "ink" };
  if (event === "TRAVEL_DOCUMENT_PUBLISHED")
    return { icon: "ticket-outline", tone: "good" };
  return { icon: "notifications-outline", tone: "ink" };
}

const dayNumber = (ms: number) => Math.floor((ms + BAKU_OFFSET_MS) / DAY);

export type Group = "today" | "yesterday" | "earlier";
export function dayGroup(iso: string, now = Date.now()): Group {
  const gap = dayNumber(now) - dayNumber(Date.parse(iso));
  return gap <= 0 ? "today" : gap === 1 ? "yesterday" : "earlier";
}

/** How long ago, in the coarsest useful unit. */
export function ago(
  iso: string,
  now = Date.now(),
): { unit: "now" | "min" | "hour" | "day"; n: number } {
  const minutes = Math.max(0, Math.floor((now - Date.parse(iso)) / 60000));
  if (minutes < 1) return { unit: "now", n: 0 };
  if (minutes < 60) return { unit: "min", n: minutes };
  if (minutes < 24 * 60) return { unit: "hour", n: Math.floor(minutes / 60) };
  return { unit: "day", n: Math.floor(minutes / (24 * 60)) };
}
