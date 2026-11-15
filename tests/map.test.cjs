const { test } = require("node:test"),
  assert = require("node:assert/strict"),
  fs = require("node:fs"),
  ts = require("typescript");
const code = ts.transpileModule(fs.readFileSync("src/features/map/geo.ts", "utf8"), {
    compilerOptions: { module: ts.ModuleKind.CommonJS },
  }).outputText,
  moduleValue = { exports: {} };
new Function("module", "exports", code)(moduleValue, moduleValue.exports);
const g = moduleValue.exports;
test("known cities land on their outline points", () => {
  const cities = [
    [40.4093, 49.8671, 362.7, 138.0],
    [41.3611, 48.5126, 266.2, 49.3],
    [40.9814, 47.8458, 218.7, 84.7],
    [41.1975, 47.1706, 170.6, 65.1],
  ];
  for (const [lat, lng, x, y] of cities) {
    const p = g.project(lat, lng);
    assert.ok(Math.abs(p.x - x) < 2 && Math.abs(p.y - y) < 2, lat + "," + lng);
  }
});
test("a tour sits in the first place of its region", () => {
  const known = ["Baku", "Quba", "Sheki"];
  assert.equal(g.mainPlace("Quba, Khinalug", known), "Quba");
  assert.equal(g.mainPlace("sheki, Gabala", known), "Sheki");
  assert.equal(g.mainPlace("Lankaran", known), null);
});
test("items on one spot are fanned out, a lone item stays put", () => {
  const out = g.fan([
    { id: "a", x: 100, y: 100 },
    { id: "b", x: 104, y: 101 },
    { id: "c", x: 300, y: 200 },
  ]);
  assert.equal(out.find((o) => o.id === "c").dx, 0);
  const a = out.find((o) => o.id === "a"),
    b = out.find((o) => o.id === "b");
  assert.ok(Math.hypot(a.dx - b.dx, a.dy - b.dy) > 20);
});
test("close items merge into one count that splits when zoomed in", () => {
  const spots = [
    { id: "a", x: 100, y: 100 },
    { id: "b", x: 101, y: 100 },
    { id: "c", x: 200, y: 200 },
  ];
  const far = g.cluster(spots, 1, 44);
  assert.deepEqual(far.map((c) => c.ids.length).sort(), [1, 2]);
  const near = g.cluster(spots, 100, 44);
  assert.equal(near.length, 3);
});
test("tapping a count zooms straight to where its items stand apart", () => {
  const zooms = [1, 2, 4, 8, 16];
  const view = { width: 320, height: 500 };
  // Two events 2 map units apart: at zoom 1 they are about 1.5 px apart, so they only separate at zoom 16.
  const close = [
    { id: "a", x: 100, y: 100 },
    { id: "b", x: 102, y: 100 },
  ];
  assert.equal(g.zoomToFit(close, 0, zooms, 320, view, 44), 4);
  // Two items 40 map units apart separate at the first step.
  const far = [
    { id: "a", x: 100, y: 100 },
    { id: "b", x: 140, y: 100 },
  ];
  assert.equal(g.zoomToFit(far, 0, zooms, 320, view, 44), 1);
});
test("zooming keeps the map point under the fingers where it was", () => {
  const edge = 34,
    pad = { x: 0, y: 0 },
    screen = { x: 150, y: 220 },
    scroll = { x: 80, y: 60 };
  const point = g.mapPointAt(scroll, screen, pad, 0.8, edge);
  // After zooming to a bigger scale, scrolling to `scrollFor` puts that same point back at `screen`.
  const next = g.scrollFor(point, screen, pad, 2.4, edge);
  const again = g.mapPointAt(next, screen, pad, 2.4, edge);
  assert.ok(Math.abs(again.x - point.x) < 1e-9 && Math.abs(again.y - point.y) < 1e-9);
  // The scroll is never negative.
  const edgeCase = g.scrollFor({ x: -100, y: -100 }, { x: 300, y: 300 }, pad, 1, edge);
  assert.ok(edgeCase.x >= 0 && edgeCase.y >= 0);
});
test("cluster centres also keep their touch targets apart", () => {
  const markers = g.cluster([
    { id: "a", x: 0, y: 0 },
    { id: "b", x: 30, y: 0 },
    { id: "c", x: 50, y: 0 },
  ], 1, 44);
  assert.equal(markers.length, 1);
  assert.deepEqual(markers[0].ids, ["a", "b", "c"]);
});
test("a full circle of markers has room for touch targets", () => {
  const slots = g.radialSlots(8);
  for (let i = 0; i < slots.length; i++) {
    const a = slots[i], b = slots[(i + 1) % slots.length];
    assert.ok(Math.hypot(a.x - b.x, a.y - b.y) > 48);
  }
});
test("street tiles use geographic bounds and cover a street viewport in Baku", () => {
  const start = g.project(40.373, 49.834);
  const end = g.project(40.369, 49.840);
  const tiles = g.streetTiles(start, end, 250);
  assert.ok(tiles.length > 0 && tiles.length < 20);
  assert.ok(tiles.every((tile) => tile.zoom === 15));
  const center = g.project(40.37083, 49.83694);
  assert.ok(tiles.some((tile) =>
    center.x >= tile.start.x && center.x <= tile.end.x &&
    center.y >= tile.start.y && center.y <= tile.end.y));
});
