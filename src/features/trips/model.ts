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
