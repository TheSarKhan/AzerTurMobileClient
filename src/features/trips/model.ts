import type { Booking, Currency } from "../../api/client";
export type Offer = {
  bookingId: string;
  title: string;
  currency: Currency;
  date: string;
  travelers: number;
  itinerary: { city: string; description: string }[];
  message: string;
  services: { key: string; name: string; total: number; policy: string }[];
};
export type Contract = {
  id: string;
  version: number;
  filename: string;
  sha256: string;
  state: string;
};
export type Payment = {
  id: string;
  contract_id: string;
  kind: string;
  service_key: string | null;
  amount_minor: number;
  currency: Currency;
  status: string;
  created_at: string;
  customer_message: string | null;
};
export function slug(b: Booking) {
  try {
    return JSON.parse(b.quotePayload).input.slug as string;
  } catch {
    return "";
  }
}
export function money(n: number, c: string, l: string) {
  return new Intl.NumberFormat(
    l === "az" ? "az-AZ" : l === "ru" ? "ru-RU" : "en-GB",
    { style: "currency", currency: c },
  ).format(n);
}
export function tripGroup(b: Booking, standardDays = 1, now = Date.now()) {
  if (["CANCELLED", "REJECTED"].includes(b.status)) return 2;
  if (b.status !== "CONFIRMED") return 1;
  try {
    const q = JSON.parse(b.quotePayload),
      days = q.input.customDays || standardDays;
    return new Date(b.departure + "T23:59:59+04:00").getTime() +
      (days - 1) * 86400000 <
      now
      ? 2
      : 0;
  } catch {
    return 0;
  }
}

export type Highlight = {
  booking: Booking;
  kind: "offer" | "confirmed" | "request";
  /** How many other journeys or requests are still open besides this one. */
  more: number;
};
/**
 * The one journey Explore points the customer to: an offer waiting for them first, then the next
 * confirmed journey (soonest departure), then the newest request. Cancelled, rejected and past
 * journeys are never highlighted.
 */
export function highlightTrip(
  rows: Booking[],
  offerBookingIds: string[],
  daysOf: (b: Booking) => number,
  now = Date.now(),
): Highlight | null {
  const open = rows.filter((b) => tripGroup(b, daysOf(b), now) !== 2);
  if (!open.length) return null;
  const offers = open.filter(
    (b) => offerBookingIds.includes(b.id) && b.status === "PENDING_REVIEW",
  );
  const confirmed = open
    .filter((b) => b.status === "CONFIRMED")
    .sort((x, y) => x.departure.localeCompare(y.departure));
  const requests = open
    .filter((b) => b.status === "PENDING_REVIEW")
    .sort((x, y) => y.createdAt.localeCompare(x.createdAt));
  const pick: [Booking | undefined, Highlight["kind"]] = offers[0]
    ? [offers[0], "offer"]
    : confirmed[0]
      ? [confirmed[0], "confirmed"]
      : requests[0]
        ? [requests[0], "request"]
        : [open[0], "request"];
  if (!pick[0]) return null;
  return { booking: pick[0], kind: pick[1], more: open.length - 1 };
}
