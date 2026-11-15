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
