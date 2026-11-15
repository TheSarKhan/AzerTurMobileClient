// Filters for the journeys on Explore (no imports on purpose, unit-tested with node --test).
export type Duration = "all" | "1" | "2-3" | "4+";
export type JourneyFilters = {
  place: string;
  duration: Duration;
  max: number | null;
};
export const noJourneyFilters: JourneyFilters = {
  place: "",
  duration: "all",
  max: null,
};
/** The places a journey can pass through (same list as the route builder). */
export const PLACES = ["Baku", "Quba", "Khinalug", "Gabala", "Sheki"];
/** Price caps offered in EUR, the unit prices are stored in. */
export const PRICE_STEPS = [100, 200, 300, 400];

export type JourneyLike = {
  region: string;
  days: number;
  fromPriceEur: number;
};

/** Which known places a journey's region names, e.g. "Quba, Khinalug" gives Quba and Khinalug. */
export function tourPlaces(region: string) {
  const text = region.toLowerCase();
  return PLACES.filter((p) => text.includes(p.toLowerCase()));
}
export function durationOf(days: number): Exclude<Duration, "all"> {
  return days <= 1 ? "1" : days <= 3 ? "2-3" : "4+";
}
export function journeyMatches(t: JourneyLike, f: JourneyFilters) {
  return (
    (!f.place || tourPlaces(t.region).includes(f.place)) &&
    (f.duration === "all" || durationOf(t.days) === f.duration) &&
    (f.max === null || t.fromPriceEur <= f.max)
  );
}
export function activeJourneyCount(f: JourneyFilters) {
  return (
    (f.place ? 1 : 0) +
    (f.duration !== "all" ? 1 : 0) +
    (f.max !== null ? 1 : 0)
  );
}
/** How many journeys would match if `patch` were applied on top of `f`. */
export function countWith<T extends JourneyLike>(
  tours: T[],
  f: JourneyFilters,
  patch: Partial<JourneyFilters>,
) {
  const next = { ...f, ...patch };
  return tours.filter((t) => journeyMatches(t, next)).length;
}
