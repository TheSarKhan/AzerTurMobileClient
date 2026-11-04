const { test } = require("node:test"),
  assert = require("node:assert/strict"),
  fs = require("node:fs"),
  ts = require("typescript");
const moduleValue = { exports: {} };
new Function(
  "module",
  "exports",
  ts.transpileModule(
    fs.readFileSync("src/features/documents/types.ts", "utf8"),
    { compilerOptions: { module: ts.ModuleKind.CommonJS } },
  ).outputText,
)(moduleValue, moduleValue.exports);
const { effectiveDocumentStatus, actionable } = moduleValue.exports;
const now = Date.parse("2026-12-18T12:00:00Z");
test("A cached upcoming/active file expires locally at its known validity boundary", () => {
  for (const status of ["UPCOMING", "ACTIVE"]) {
    const d = { status, ends_at: "2026-12-18T12:00:00Z" };
    assert.equal(effectiveDocumentStatus(d, now), "EXPIRED");
    assert.equal(actionable(d, now), false);
  }
});
test("Clock changes never reactivate a revoked or superseded file", () => {
  for (const status of [
    "REVOKED",
    "SUPERSEDED",
    "CANCELLED",
    "REQUIRES_REVIEW",
  ]) {
    const d = { status, ends_at: "2026-12-19T12:00:00Z" };
    assert.equal(effectiveDocumentStatus(d, now), status);
    assert.equal(actionable(d, now), false);
  }
});
test("An unexpired copy keeps its last known state without claiming live activation", () => {
  const d = { status: "UPCOMING", ends_at: "2026-12-19T12:00:00Z" };
  assert.equal(effectiveDocumentStatus(d, now), "UPCOMING");
  assert.equal(actionable(d, now), true);
});
