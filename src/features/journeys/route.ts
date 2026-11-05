// Pure route rules shared by the planner screen and its tests (no imports on purpose).
export type RouteStop = { city: string; days: number };
export const MAX_DAYS = 14;
const destinations = ["Baku", "Quba", "Khinalug", "Gabala", "Sheki"];
// Any destination may follow any other; the team arranges the transfers between them.
export const connections: Record<string, string[]> = Object.fromEntries(
  destinations.map((city) => [city, [...destinations]]),
);
export const templates: Record<string, string[]> = {
  "baku-discovery": ["Baku"],
  "quba-khinalug": ["Quba", "Khinalug"],
  "sheki-gabala": ["Baku", "Gabala", "Sheki"],
};
export const places: Record<
  string,
  { name: [string, string, string]; note: [string, string, string] }
> = {
  Baku: {
    name: ["Baku", "Баку", "Bakı"],
    note: [
      "The capital and its Old City",
      "Столица и Старый город",
      "Paytaxt və İçərişəhər",
    ],
  },
  Quba: {
    name: ["Quba", "Куба", "Quba"],
    note: [
      "Forests, orchards and the Caucasus foothills",
      "Леса, сады и предгорья Кавказа",
      "Meşələr, bağlar və Qafqaz ətəkləri",
    ],
  },
  Khinalug: {
    name: ["Khinalug", "Хыналыг", "Xınalıq"],
    note: [
      "One of the highest villages in Europe",
      "Одно из самых высокогорных сёл Европы",
      "Avropanın ən hündürdə yerləşən kəndlərindən",
    ],
  },
  Gabala: {
    name: ["Gabala", "Габала", "Qəbələ"],
    note: [
      "Mountain lakes, forests and fresh air",
      "Горные озёра, леса и свежий воздух",
      "Dağ gölləri, meşələr və təmiz hava",
    ],
  },
  Sheki: {
    name: ["Sheki", "Шеки", "Şəki"],
    note: [
      "Silk Road caravanserais and the Khan's Palace",
      "Караван-сараи и Дворец ханов",
      "İpək yolu karvansaraları və Xan sarayı",
    ],
  },
};
/** One city per day, every step to a connected city (or the same one). */
export function isValidRoute(route: string[]): boolean {
  return (
    route.length > 0 &&
    route.length <= MAX_DAYS &&
    route.every(
      (city, i) =>
        Object.prototype.hasOwnProperty.call(connections, city) &&
        (i === 0 || connections[route[i - 1]].includes(city)),
    )
  );
}
export function toStops(route: string[]): RouteStop[] {
  const stops: RouteStop[] = [];
  for (const city of route) {
    const last = stops[stops.length - 1];
    if (last && last.city === city) last.days++;
    else stops.push({ city, days: 1 });
  }
  return stops;
}
export function toRoute(stops: RouteStop[]): string[] {
  const route: string[] = [];
  for (const stop of stops)
    for (let i = 0; i < stop.days; i++) route.push(stop.city);
  return route;
}
/** Destinations a stop at `index` can take: connected to both neighbours, never equal to one. */
export function stopOptions(stops: RouteStop[], index: number): string[] {
  const before = stops[index - 1]?.city,
    after = index < stops.length ? stops[index + 1]?.city : undefined;
  return Object.keys(connections).filter(
    (city) =>
      (!before || (city !== before && connections[before].includes(city))) &&
      (!after || (city !== after && connections[city].includes(after))),
  );
}
/** Days that may still be given to the stop at `index` (a new stop when index is past the end). */
export function daysLeft(stops: RouteStop[], index: number): number {
  const total = stops.reduce((n, s) => n + s.days, 0);
  return MAX_DAYS - (total - (stops[index]?.days ?? 0));
}
export function withoutStop(stops: RouteStop[], index: number): RouteStop[] {
  const merged: RouteStop[] = [];
  stops.forEach((stop, i) => {
    if (i === index) return;
    const last = merged[merged.length - 1];
    if (last && last.city === stop.city) last.days += stop.days;
    else merged.push({ ...stop });
  });
  return merged;
}
export function canRemoveStop(stops: RouteStop[], index: number): boolean {
  return stops.length > 1 && isValidRoute(toRoute(withoutStop(stops, index)));
}
export function saveStop(
  stops: RouteStop[],
  index: number,
  stop: RouteStop,
): string[] | null {
  const next = stops.map((s) => ({ ...s }));
  if (index >= next.length) next.push({ ...stop });
  else next[index] = { ...stop };
  const route = toRoute(next);
  return isValidRoute(route) ? route : null;
}
