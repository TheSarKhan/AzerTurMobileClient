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
const { quickRange } = load("src/features/events/ranges.ts");
const { highlightTrip } = load("src/features/trips/model.ts");
// 2026-11-18 is a Wednesday. 10:00 Baku = 06:00 UTC.
const wed = Date.parse("2026-11-18T06:00:00Z");
test("today, this week and the weekend are Baku dates", () => {
  assert.equal(quickRange("any", wed), null);
  assert.deepEqual(quickRange("today", wed), { from: "2026-11-18", to: "2026-11-18" });
  assert.deepEqual(quickRange("week", wed), { from: "2026-11-18", to: "2026-11-24" });
  assert.deepEqual(quickRange("weekend", wed), { from: "2026-11-21", to: "2026-11-22" });
});
test("late evening UTC is already the next day in Baku", () => {
  // 21:30 UTC on Tuesday 17th is 01:30 Wednesday 18th in Baku.
  const late = Date.parse("2026-11-17T21:30:00Z");
  assert.equal(quickRange("today", late).from, "2026-11-18");
});
test("on a Saturday the weekend starts today, on a Sunday it is today only", () => {
  const sat = Date.parse("2026-11-21T08:00:00Z"),
    sun = Date.parse("2026-11-22T08:00:00Z");
  assert.deepEqual(quickRange("weekend", sat), { from: "2026-11-21", to: "2026-11-22" });
  assert.deepEqual(quickRange("weekend", sun), { from: "2026-11-22", to: "2026-11-22" });
});
const now = Date.parse("2026-11-15T08:00:00Z");
const trip = (id, status, departure, createdAt) => ({
  id, status, departure, createdAt, quotePayload: JSON.stringify({ input: { slug: "x" } }),
});
test("an offer waiting beats a confirmed journey, which beats a request", () => {
  const rows = [
    trip("a", "CONFIRMED", "2026-12-20", "2026-11-01"),
    trip("b", "PENDING_REVIEW", "2026-12-25", "2026-11-10"),
    trip("c", "PENDING_REVIEW", "2026-12-26", "2026-11-12"),
  ];
  const withOffer = highlightTrip(rows, ["b"], () => 1, now);
  assert.equal(withOffer.booking.id, "b");
  assert.equal(withOffer.kind, "offer");
  assert.equal(withOffer.more, 2);
  const noOffer = highlightTrip(rows, [], () => 1, now);
  assert.equal(noOffer.booking.id, "a");
  assert.equal(noOffer.kind, "confirmed");
  const onlyRequests = highlightTrip(rows.slice(1), [], () => 1, now);
  assert.equal(onlyRequests.booking.id, "c", "newest request first");
  assert.equal(onlyRequests.kind, "request");
});
test("cancelled, rejected and finished journeys are never highlighted", () => {
  const rows = [
    trip("x", "CANCELLED", "2026-12-20", "2026-11-01"),
    trip("y", "REJECTED", "2026-12-21", "2026-11-02"),
    trip("z", "CONFIRMED", "2026-10-01", "2026-09-01"),
  ];
  assert.equal(highlightTrip(rows, [], () => 1, now), null);
  assert.equal(highlightTrip([], [], () => 1, now), null);
});
