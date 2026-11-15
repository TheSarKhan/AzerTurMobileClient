const { test } = require("node:test"),
  assert = require("node:assert/strict"),
  fs = require("node:fs"),
  ts = require("typescript");
const code = ts.transpileModule(
    fs.readFileSync("src/features/journeys/notice-meta.ts", "utf8"),
    { compilerOptions: { module: ts.ModuleKind.CommonJS } },
  ).outputText,
  m = { exports: {} };
new Function("module", "exports", code)(m, m.exports);
const { noticeMeta, dayGroup, ago } = m.exports;
test("every known update has its own icon and an unknown one still gets a bell", () => {
  for (const e of [
    "OFFER_SENT", "CONTRACT_SENT", "PAYMENT_REQUESTED", "PAYMENT_RECEIVED",
    "REVISED_PLAN_SENT", "AMENDMENT_SENT", "AMENDMENT_ACCEPTED",
    "AMENDMENT_DECLINED", "AMENDMENT_REFUND_UPDATED", "REFUND_UPDATED",
    "TRAVEL_DOCUMENT_PUBLISHED",
  ]) {
    const x = noticeMeta(e);
    assert.match(x.icon, /-outline$/);
    assert.ok(["ink", "accent", "good", "danger"].includes(x.tone));
  }
  assert.equal(noticeMeta("SOMETHING_NEW").icon, "notifications-outline");
  assert.equal(noticeMeta("AMENDMENT_DECLINED").tone, "danger");
  assert.equal(noticeMeta("PAYMENT_RECEIVED").tone, "good");
});
test("days are Baku days: late evening UTC already belongs to the next day", () => {
  const now = Date.parse("2026-11-15T10:00:00Z"); // 14:00 in Baku
  assert.equal(dayGroup("2026-11-15T09:00:00Z", now), "today");
  assert.equal(dayGroup("2026-11-14T21:30:00Z", now), "today"); // 01:30 on the 15th in Baku
  assert.equal(dayGroup("2026-11-14T10:00:00Z", now), "yesterday");
  assert.equal(dayGroup("2026-11-10T10:00:00Z", now), "earlier");
});
test("time ago uses the coarsest useful unit", () => {
  const now = Date.parse("2026-11-15T10:00:00Z");
  assert.deepEqual(ago("2026-11-15T09:59:40Z", now), { unit: "now", n: 0 });
  assert.deepEqual(ago("2026-11-15T09:30:00Z", now), { unit: "min", n: 30 });
  assert.deepEqual(ago("2026-11-15T05:00:00Z", now), { unit: "hour", n: 5 });
  assert.deepEqual(ago("2026-11-12T10:00:00Z", now), { unit: "day", n: 3 });
  assert.deepEqual(ago("2026-11-15T10:05:00Z", now), { unit: "now", n: 0 }, "a clock a little ahead is never negative");
});
