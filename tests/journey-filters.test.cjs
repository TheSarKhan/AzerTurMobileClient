const { test } = require("node:test"),
  assert = require("node:assert/strict"),
  fs = require("node:fs"),
  ts = require("typescript");
function load(file) {
  const code = ts.transpileModule(fs.readFileSync(file, "utf8"), {
      compilerOptions: { module: ts.ModuleKind.CommonJS },
    }).outputText,
    m = { exports: {} };
  new Function("module", "exports", code)(m, m.exports);
  return m.exports;
}
const f = load("src/features/explore/journey-filters.ts");
const route = load("src/features/journeys/route.ts");
const tours = [
  { region: "Quba, Khinalug", days: 2, fromPriceEur: 240 },
  { region: "Sheki, Gabala", days: 3, fromPriceEur: 410 },
  { region: "Baku, Old City", days: 1, fromPriceEur: 85 },
  { region: "Gabala", days: 1, fromPriceEur: 112 },
  { region: "Gabala, Sheki", days: 4, fromPriceEur: 485 },
];
test("the place list is the route builder's list", () => {
  assert.deepEqual(f.PLACES, Object.keys(route.places));
});
test("a region counts for every known place it names", () => {
  assert.deepEqual(f.tourPlaces("Quba, Khinalug"), ["Quba", "Khinalug"]);
  assert.deepEqual(f.tourPlaces("Baku, Old City"), ["Baku"]);
  assert.deepEqual(f.tourPlaces("Somewhere else"), []);
});
test("duration bands are 1 day, 2 to 3 days and 4 or more", () => {
  assert.deepEqual([1, 2, 3, 4, 9].map(f.durationOf), ["1", "2-3", "2-3", "4+", "4+"]);
});
test("filters combine: place, duration and a price cap", () => {
  const names = (flt) => tours.filter((t) => f.journeyMatches(t, flt)).map((t) => t.region);
  const none = f.noJourneyFilters;
  assert.equal(names(none).length, 5);
  assert.deepEqual(names({ ...none, place: "Gabala" }), ["Sheki, Gabala", "Gabala", "Gabala, Sheki"]);
  assert.deepEqual(names({ ...none, duration: "1" }), ["Baku, Old City", "Gabala"]);
  assert.deepEqual(names({ ...none, max: 240 }), ["Quba, Khinalug", "Baku, Old City", "Gabala"]);
  assert.deepEqual(names({ place: "Gabala", duration: "1", max: 100 }), []);
  assert.equal(f.activeJourneyCount({ place: "Gabala", duration: "1", max: 100 }), 3);
  assert.equal(f.activeJourneyCount(none), 0);
});
test("the count for an option takes the other chosen filters into account", () => {
  const base = { ...f.noJourneyFilters, place: "Gabala" };
  assert.equal(f.countWith(tours, base, { duration: "1" }), 1);
  assert.equal(f.countWith(tours, base, { duration: "4+" }), 1);
  assert.equal(f.countWith(tours, base, { max: 100 }), 0);
  assert.equal(f.countWith(tours, f.noJourneyFilters, { place: "Sheki" }), 2);
});
