// Pure map rules (no imports on purpose, unit-tested with node --test).
// Latitude/longitude are placed on the same 400 x 325.9 box as the country outline in
// journeys/route-geo.ts. The two scales were fitted to the known city points there
// (Baku, Quba, Gabala, Sheki, Khinalug) and agree with them to about one unit.
// The visible area in map units: the country plus a small margin (Absheron reaches past x = 400).
export const mapBox = { x: -4, y: -4, width: 424, height: 334 };
const origin = { x: 362.7, y: 138, lat: 40.4093, lng: 49.8671 };
const longitudeScale = 71.24;
const latitudeScale = 93.2;

export function project(lat: number, lng: number) {
  return {
    x: origin.x + (lng - origin.lng) * longitudeScale,
    y: origin.y - (lat - origin.lat) * latitudeScale,
  };
}

/** Convert the schematic camera to the centre and zoom used by the vector basemap. */
export function streetCamera(point: Pair, scale: number) {
  return {
    latitude: origin.lat - (point.y - origin.y) / latitudeScale,
    longitude: origin.lng + (point.x - origin.x) / longitudeScale,
    zoom: Math.log2(scale * longitudeScale * 360 / 512),
  };
}

/** Return just the street tiles that intersect the visible viewport. */
export function streetTiles(northwest: Pair, southeast: Pair, scale: number) {
  const zoom = Math.min(19, Math.max(7, Math.round(Math.log2(
    scale * longitudeScale * 360 / 256,
  ))));
  const size = 2 ** zoom;
  const tileX = (mapX: number) =>
    ((mapX - origin.x) / longitudeScale + origin.lng + 180) * size / 360;
  const tileY = (mapY: number) => {
    const radians = (origin.lat - (mapY - origin.y) / latitudeScale) * Math.PI / 180;
    return (1 - Math.asinh(Math.tan(radians)) / Math.PI) * size / 2;
  };
  const longitude = (x: number) => (x * 360) / size - 180;
  const latitude = (y: number) =>
    Math.atan(Math.sinh(Math.PI * (1 - (2 * y) / size))) * 180 / Math.PI;
  const tiles = [];
  for (let y = Math.floor(tileY(northwest.y)); y < Math.ceil(tileY(southeast.y)); y++) {
    for (let x = Math.floor(tileX(northwest.x)); x < Math.ceil(tileX(southeast.x)); x++) {
      const start = project(latitude(y), longitude(x));
      const end = project(latitude(y + 1), longitude(x + 1));
      tiles.push({ x, y, zoom, start, end });
    }
  }
  return tiles;
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
  const markers = groups.map((group) => ({
    x: group.reduce((sum, point) => sum + point.x, 0) / group.length,
    y: group.reduce((sum, point) => sum + point.y, 0) / group.length,
    ids: group.map((point) => point.id),
  }));
  // Group centres can touch even when the first point of each group did not.
  for (let index = 0; index < markers.length; index++) {
    const marker = markers[index];
    const otherIndex = markers.findIndex((other, i) =>
      i !== index && Math.hypot(marker.x - other.x, marker.y - other.y) * scale <= radius,
    );
    if (otherIndex < 0) continue;
    const other = markers[otherIndex];
    const count = marker.ids.length + other.ids.length;
    marker.x = (marker.x * marker.ids.length + other.x * other.ids.length) / count;
    marker.y = (marker.y * marker.ids.length + other.y * other.ids.length) / count;
    marker.ids.push(...other.ids);
    markers.splice(otherIndex, 1);
    index = -1;
  }
  return markers;
}
/**
 * The zoom level to jump to when a count is tapped: the first level above `from` where its items
 * stand apart as separate markers, or the last level before they would no longer fit the screen.
 * `baseWidth` is the map width at zoom 1 in pixels; `zooms` are the multipliers, smallest first.
 */
export function zoomToFit(
  spots: Spot[],
  from: number,
  zooms: number[],
  baseWidth: number,
  view: { width: number; height: number },
  radius: number,
) {
  let chosen = from;
  for (let level = from + 1; level < zooms.length; level++) {
    const scale = (baseWidth * zooms[level]) / mapBox.width;
    const xs = spots.map((p) => p.x * scale),
      ys = spots.map((p) => p.y * scale);
    const wide = Math.max(...xs) - Math.min(...xs),
      high = Math.max(...ys) - Math.min(...ys);
    if (
      level > from + 1 &&
      (wide > view.width * 0.8 || high > view.height * 0.8)
    )
      break;
    chosen = level;
    if (cluster(spots, scale, radius).length === spots.length) break;
  }
  return chosen;
}
/**
 * Pinch and wheel zooming keeps the map point under the fingers where it is. `scroll` is how far
 * the map is scrolled, `screen` a position in the viewport, `pad` the empty space round a map
 * smaller than the viewport and `edge` the margin around the map.
 */
type Pair = { x: number; y: number };
export function mapPointAt(
  scroll: Pair,
  screen: Pair,
  pad: Pair,
  scale: number,
  edge: number,
): Pair {
  return {
    x: (scroll.x + screen.x - pad.x - edge) / scale + mapBox.x,
    y: (scroll.y + screen.y - pad.y - edge) / scale + mapBox.y,
  };
}
/** The scroll that puts `point` at `screen`, never negative. */
export function scrollFor(
  point: Pair,
  screen: Pair,
  pad: Pair,
  scale: number,
  edge: number,
): Pair {
  return {
    x: Math.max(0, pad.x + edge + (point.x - mapBox.x) * scale - screen.x),
    y: Math.max(0, pad.y + edge + (point.y - mapBox.y) * scale - screen.y),
  };
}

/** At most eight markers fit around the group without their 40px touch targets crossing. */
export function radialSlots(count: number) {
  return Array.from({ length: count }, (_, index) => {
    const angle = (Math.PI * 2 * index) / count - Math.PI / 2;
    return { x: Math.cos(angle) * 74, y: Math.sin(angle) * 74 };
  });
}
