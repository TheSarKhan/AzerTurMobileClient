// Pure helpers for the events screens (no imports, unit-tested with node --test).
// Baku is UTC+4 all year (no DST), so dates are shown by shifting the instant by 4 hours.
const BAKU_OFFSET_MS = 4 * 3600 * 1000;
const MONTHS = {
  en: [
    "Jan",
    "Feb",
    "Mar",
    "Apr",
    "May",
    "Jun",
    "Jul",
    "Aug",
    "Sep",
    "Oct",
    "Nov",
    "Dec",
  ],
  ru: [
    "янв",
    "фев",
    "мар",
    "апр",
    "мая",
    "июн",
    "июл",
    "авг",
    "сен",
    "окт",
    "ноя",
    "дек",
  ],
  az: [
    "yan",
    "fev",
    "mar",
    "apr",
    "may",
    "iyn",
    "iyl",
    "avq",
    "sen",
    "okt",
    "noy",
    "dek",
  ],
} as const;
export type EventLocale = keyof typeof MONTHS;
function parts(iso: string) {
  const d = new Date(new Date(iso).getTime() + BAKU_OFFSET_MS);
  return {
    y: d.getUTCFullYear(),
    m: d.getUTCMonth(),
    day: d.getUTCDate(),
    hh: d.getUTCHours(),
    mm: d.getUTCMinutes(),
  };
}
const two = (n: number) => String(n).padStart(2, "0");
export function formatDay(iso: string, locale: EventLocale) {
  const p = parts(iso);
  return p.day + " " + MONTHS[locale][p.m] + " " + p.y;
}
export function formatTime(iso: string) {
  const p = parts(iso);
  return two(p.hh) + ":" + two(p.mm);
}
export function sameDay(a: string, b: string) {
  const x = parts(a),
    y = parts(b);
  return x.y === y.y && x.m === y.m && x.day === y.day;
}
/** "7 Nov 2026 · 20:00", or just the date when the time is not known. */
export function formatWhen(
  startsAt: string,
  endsAt: string,
  timeKnown: boolean,
  locale: EventLocale,
) {
  const first = formatDay(startsAt, locale);
  if (!sameDay(startsAt, endsAt)) {
    return first + " – " + formatDay(endsAt, locale);
  }
  return timeKnown ? first + " · " + formatTime(startsAt) : first;
}
export function formatPrice(
  free: boolean,
  priceFromMinor: number | null,
  currency: string,
  words: { free: string; from: string; see: string },
) {
  if (free) return words.free;
  if (priceFromMinor == null) return words.see;
  const major = priceFromMinor / 100;
  const text = Number.isInteger(major) ? String(major) : major.toFixed(2);
  return words.from + " " + text + " " + currency;
}
/** About 1 km: enough for "near me", too coarse to identify a street. */
export function round2(n: number) {
  return Math.round(n * 100) / 100;
}
export function formatDistance(km: number | null) {
  if (km == null) return "";
  return km < 10 ? km.toFixed(1) + " km" : Math.round(km) + " km";
}
export function mapUrl(lat: number, lng: number) {
  return (
    "https://www.google.com/maps/search/?api=1&query=" +
    encodeURIComponent(lat + "," + lng)
  );
}
export function isHttps(url: string | null | undefined) {
  return !!url && /^https:\/\//i.test(url);
}
