import { quickRange, type Quick } from "./ranges";

/** What the person has chosen to filter events by. Shared by the Events tab and Explore. */
export type EventFilters = {
  when: Quick;
  city: string;
  category: string;
  near: { lat: number; lng: number } | null;
  radius: number;
};
export const noFilters: EventFilters = {
  when: "any",
  city: "",
  category: "",
  near: null,
  radius: 25,
};

/** How many filters are switched on (the radius only counts with "near me"). */
export function activeCount(f: EventFilters) {
  return (
    (f.when !== "any" ? 1 : 0) +
    (f.city ? 1 : 0) +
    (f.category ? 1 : 0) +
    (f.near ? 1 : 0)
  );
}

/** The events API query for these filters. Near me replaces the city. */
export function eventQuery(f: EventFilters, page = 0, size = 8, text = "") {
  const q = new URLSearchParams({ page: String(page), size: String(size) });
  if (f.near) {
    q.set("lat", String(f.near.lat));
    q.set("lng", String(f.near.lng));
    q.set("radiusKm", String(f.radius));
  } else if (f.city) q.set("city", f.city);
  if (f.category) q.set("category", f.category);
  const range = quickRange(f.when);
  if (range) {
    q.set("from", range.from);
    q.set("to", range.to);
  }
  if (text.trim()) q.set("q", text.trim());
  return q;
}
