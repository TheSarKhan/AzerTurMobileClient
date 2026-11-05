const { test } = require("node:test"),
  assert = require("node:assert/strict"),
  fs = require("node:fs"),
  ts = require("typescript");
const code = ts.transpileModule(
    fs.readFileSync("src/features/events/format.ts", "utf8"),
    { compilerOptions: { module: ts.ModuleKind.CommonJS } },
  ).outputText,
  moduleValue = { exports: {} };
new Function("module", "exports", code)(moduleValue, moduleValue.exports);
const f = moduleValue.exports;
const words = { free: "Free", from: "from", see: "See tickets" };
test("times are shown in Baku time (UTC+4)", () => {
  assert.equal(f.formatTime("2026-11-07T16:00:00Z"), "20:00");
  assert.equal(
    f.formatWhen("2026-11-07T16:00:00Z", "2026-11-07T17:30:00Z", true, "en"),
    "7 Nov 2026 · 20:00",
  );
});
test("late evening UTC is already the next day in Baku", () => {
  assert.equal(f.formatDay("2026-12-31T21:00:00Z", "en"), "1 Jan 2027");
});
test("date-only events show no time; multi-day events show a range", () => {
  assert.equal(
    f.formatWhen("2026-12-19T20:00:00Z", "2026-12-20T19:59:59Z", false, "en"),
    "20 Dec 2026",
  );
  assert.equal(
    f.formatWhen("2027-09-23T20:00:00Z", "2027-09-26T19:59:59Z", false, "az"),
    "24 sen 2027 – 26 sen 2027",
  );
});
test("month names exist in all three languages", () => {
  assert.equal(f.formatDay("2026-11-07T10:00:00Z", "ru"), "7 ноя 2026");
  assert.equal(f.formatDay("2026-11-07T10:00:00Z", "az"), "7 noy 2026");
});
test("price wording", () => {
  assert.equal(f.formatPrice(true, null, "AZN", words), "Free");
  assert.equal(f.formatPrice(false, null, "AZN", words), "See tickets");
  assert.equal(f.formatPrice(false, 2500, "AZN", words), "from 25 AZN");
  assert.equal(f.formatPrice(false, 2550, "AZN", words), "from 25.50 AZN");
});
test("coordinates are rounded to 2 decimals before leaving the device", () => {
  assert.equal(f.round2(40.40931), 40.41);
  assert.equal(f.round2(49.8671), 49.87);
});
test("distance, map link and https check", () => {
  assert.equal(f.formatDistance(null), "");
  assert.equal(f.formatDistance(3.456), "3.5 km");
  assert.equal(f.formatDistance(42.4), "42 km");
  assert.equal(
    f.mapUrl(40.4, 49.8),
    "https://www.google.com/maps/search/?api=1&query=40.4%2C49.8",
  );
  assert.equal(f.isHttps("https://x.az"), true);
  assert.equal(f.isHttps("http://x.az"), false);
  assert.equal(f.isHttps("javascript:alert(1)"), false);
  assert.equal(f.isHttps(null), false);
});
