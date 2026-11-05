const { test } = require("node:test"),
  assert = require("node:assert/strict"),
  fs = require("node:fs"),
  ts = require("typescript");
const code = ts.transpileModule(
    fs.readFileSync("src/features/journeys/route.ts", "utf8"),
    {
      compilerOptions: { module: ts.ModuleKind.CommonJS },
    },
  ).outputText,
  moduleValue = { exports: {} };
new Function("module", "exports", code)(moduleValue, moduleValue.exports);
const r = moduleValue.exports;
test("a route is one city per day and only connected steps are valid", () => {
  assert.equal(r.isValidRoute(["Quba", "Khinalug", "Khinalug"]), true);
  assert.equal(r.isValidRoute(["Baku", "Khinalug"]), false);
  assert.equal(r.isValidRoute(["Atlantis"]), false);
  assert.equal(r.isValidRoute([]), false);
  assert.equal(r.isValidRoute(Array(15).fill("Baku")), false);
  assert.equal(r.isValidRoute(Array(14).fill("Baku")), true);
});
test("stops and days round-trip", () => {
  const route = ["Quba", "Khinalug", "Khinalug", "Quba"];
  const stops = r.toStops(route);
  assert.deepEqual(stops, [
    { city: "Quba", days: 1 },
    { city: "Khinalug", days: 2 },
    { city: "Quba", days: 1 },
  ]);
  assert.deepEqual(r.toRoute(stops), route);
});
test("destination options respect both neighbours and never repeat one", () => {
  const stops = r.toStops(["Quba", "Khinalug"]);
  assert.deepEqual(r.stopOptions(stops, 2), ["Quba"]); // after Khinalug only Quba connects
  assert.deepEqual(r.stopOptions(r.toStops(["Baku"]), 1).sort(), [
    "Gabala",
    "Quba",
  ]);
  const mid = r.toStops(["Baku", "Quba", "Khinalug"]);
  assert.deepEqual(r.stopOptions(mid, 1), ["Quba"]); // between Baku and Khinalug only Quba fits
  assert.deepEqual(r.stopOptions(r.toStops(["Sheki"]), 1), ["Gabala"]);
});
test("days left counts the whole route and frees the edited stop", () => {
  const stops = r.toStops(Array(10).fill("Baku"));
  assert.equal(r.daysLeft(stops, 1), 4); // adding a stop
  assert.equal(r.daysLeft(stops, 0), 14); // editing the only stop
});
test("removing a stop merges equal neighbours and is blocked when it would disconnect the route", () => {
  const loop = r.toStops(["Quba", "Khinalug", "Quba"]);
  assert.equal(r.canRemoveStop(loop, 1), true);
  assert.deepEqual(r.withoutStop(loop, 1), [{ city: "Quba", days: 2 }]);
  const line = r.toStops(["Baku", "Quba", "Khinalug"]);
  assert.equal(r.canRemoveStop(line, 1), false);
  assert.equal(r.canRemoveStop(line, 0), true);
  assert.equal(r.canRemoveStop(r.toStops(["Baku"]), 0), false);
});
test("saving a stop returns the new route or null when it would be invalid", () => {
  const stops = r.toStops(["Quba", "Khinalug"]);
  assert.deepEqual(r.saveStop(stops, 2, { city: "Quba", days: 2 }), [
    "Quba",
    "Khinalug",
    "Quba",
    "Quba",
  ]);
  assert.equal(r.saveStop(stops, 2, { city: "Baku", days: 1 }), null);
  assert.deepEqual(r.saveStop(stops, 1, { city: "Quba", days: 1 }), [
    "Quba",
    "Quba",
  ]);
});
