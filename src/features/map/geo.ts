// Pure map rules (no imports on purpose, unit-tested with node --test).
// Latitude/longitude are placed on the same 400 x 325.9 box as the country outline in
// journeys/route-geo.ts. The two scales were fitted to the known city points there
// (Baku, Quba, Gabala, Sheki, Khinalug) and agree with them to about one unit.
// The visible area in map units: the country plus a small margin (Absheron reaches past x = 400).
export const mapBox = { x: -4, y: -4, width: 424, height: 334 };
export function project(lat: number, lng: number) {
  return {
    x: 362.7 + (lng - 49.8671) * 71.24,
    y: 138.0 - (lat - 40.4093) * 93.2,
  };
}
/** The first place named in a tour's region, e.g. "Quba, Khinalug" gives "Quba". */
export function mainPlace(region: string, known: string[]) {
  const first = region.split(",")[0].trim().toLowerCase();
  return known.find((name) => name.toLowerCase() === first) ?? null;
}
export type Spot = { id: string; x: number; y: number };
export type Placed = Spot & { dx: number; dy: number };
/**
 * Items on (almost) the same spot would hide each other, so each group is fanned out on a small
 * circle around that spot, shifted toward the middle of the map so a spot on the coast does not
 * push its items off the edge. Offsets are in screen pixels; `near` is in map units.
 */
export function fan(spots: Spot[], near = 12, step = 18): Placed[] {
  const groups: Spot[][] = [];
  for (const spot of spots) {
    const group = groups.find(
      (g) => Math.hypot(g[0].x - spot.x, g[0].y - spot.y) <= near,
    );
    if (group) group.push(spot);
    else groups.push([spot]);
  }
  return groups.flatMap((group) =>
    group.map((spot, i) => {
      if (group.length === 1) return { ...spot, dx: 0, dy: 0 };
      const radius = step + group.length * 5;
      const away =
        Math.hypot(
          mapBox.x + mapBox.width / 2 - group[0].x,
          mapBox.y + mapBox.height / 2 - group[0].y,
        ) || 1;
      const shiftX =
        ((mapBox.x + mapBox.width / 2 - group[0].x) / away) * radius * 0.8;
      const shiftY =
        ((mapBox.y + mapBox.height / 2 - group[0].y) / away) * radius * 0.8;
      const angle = -Math.PI / 2 + (2 * Math.PI * i) / group.length;
      return {
        ...spot,
        dx: Math.round(Math.cos(angle) * radius + shiftX),
        dy: Math.round(Math.sin(angle) * radius + shiftY),
      };
    }),
  );
}
export type Cluster = { x: number; y: number; ids: string[] };
/**
 * Groups spots that would touch on screen at the current zoom. `scale` is screen pixels per map
 * unit and `radius` the distance in pixels under which two spots count as one. A group of one is
 * just that spot; a bigger group sits at the middle of its members.
 */
export function cluster(
  spots: Spot[],
  scale: number,
  radius: number,
): Cluster[] {
  const groups: Spot[][] = [];
  for (const spot of spots) {
    const group = groups.find(
      (g) =>
        Math.hypot((g[0].x - spot.x) * scale, (g[0].y - spot.y) * scale) <=
        radius,
    );
    if (group) group.push(spot);
    else groups.push([spot]);
  }
  return groups.map((g) => ({
    x: g.reduce((sum, p) => sum + p.x, 0) / g.length,
    y: g.reduce((sum, p) => sum + p.y, 0) / g.length,
    ids: g.map((p) => p.id),
  }));
}
