const { test } = require("node:test"),
  assert = require("node:assert/strict"),
  fs = require("node:fs"),
  ts = require("typescript");
function load(file, deps = {}) {
  const code = ts.transpileModule(fs.readFileSync(file, "utf8"), {
      compilerOptions: { module: ts.ModuleKind.CommonJS },
    }).outputText,
    m = { exports: {} };
  new Function("module", "exports", "require", code)(m, m.exports, (n) => deps[n]);
  return m.exports;
}
const ranges = load("src/features/events/ranges.ts");
const { activeCount, eventQuery, noFilters } = load("src/features/events/filters.ts", {
  "./ranges": ranges,
});
const params = (q) => Object.fromEntries(q);
test("no filter means a plain page request", () => {
  assert.equal(activeCount(noFilters), 0);
  assert.deepEqual(params(eventQuery(noFilters, 0, 8)), { page: "0", size: "8" });
});
test("each filter that is on is counted once and sent to the API", () => {
  const f = { ...noFilters, when: "week", city: "baku", category: "SPORT" };
  assert.equal(activeCount(f), 3);
  const q = params(eventQuery(f, 2, 12, " jazz "));
  assert.equal(q.city, "baku");
  assert.equal(q.category, "SPORT");
  assert.equal(q.q, "jazz");
  assert.equal(q.page, "2");
  assert.match(q.from, /^\d{4}-\d{2}-\d{2}$/);
  assert.match(q.to, /^\d{4}-\d{2}-\d{2}$/);
});
test("near me replaces the city and the radius only counts with it", () => {
  const near = { lat: 40.41, lng: 49.87 };
  const f = { ...noFilters, city: "baku", near, radius: 50 };
  assert.equal(activeCount(f), 2, "city and near me are both switched on");
  const q = params(eventQuery(f));
  assert.equal(q.city, undefined, "the API search near me ignores the city");
  assert.equal(q.lat, "40.41");
  assert.equal(q.lng, "49.87");
  assert.equal(q.radiusKm, "50");
  assert.equal(activeCount({ ...noFilters, radius: 100 }), 0);
});
