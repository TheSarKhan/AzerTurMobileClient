const { test } = require("node:test"),
  assert = require("node:assert/strict"),
  fs = require("node:fs"),
  ts = require("typescript");
const code = ts.transpileModule(
    fs.readFileSync("src/features/trips/model.ts", "utf8"),
    { compilerOptions: { module: ts.ModuleKind.CommonJS } },
  ).outputText,
  moduleValue = { exports: {} };
new Function("module", "exports", code)(moduleValue, moduleValue.exports);
const { tripGroup } = moduleValue.exports;
const booking = {
  status: "CONFIRMED",
  departure: "2026-12-18",
  quotePayload: JSON.stringify({ input: {} }),
};
test("Standard tours remain upcoming through their full catalogue duration in Baku time", () => {
  assert.equal(
    tripGroup(booking, 2, Date.parse("2026-12-19T22:00:00+04:00")),
    0,
  );
  assert.equal(
    tripGroup(booking, 2, Date.parse("2026-12-20T00:00:00+04:00")),
    2,
  );
});
test("One-day and custom tours end on the last service day, not a day later", () => {
  assert.equal(
    tripGroup(booking, 1, Date.parse("2026-12-19T00:00:00+04:00")),
    2,
  );
  const custom = {
    ...booking,
    quotePayload: JSON.stringify({ input: { customDays: 3 } }),
  };
  assert.equal(
    tripGroup(custom, 1, Date.parse("2026-12-20T23:00:00+04:00")),
    0,
  );
});
test("Unconfirmed requests and terminal journeys have separate groups", () => {
  assert.equal(tripGroup({ ...booking, status: "PENDING_REVIEW" }), 1);
  assert.equal(tripGroup({ ...booking, status: "CANCELLED" }), 2);
});
