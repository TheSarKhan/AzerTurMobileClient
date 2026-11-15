const { test } = require("node:test"),
  assert = require("node:assert/strict"),
  fs = require("node:fs"),
  ts = require("typescript");
const code = ts.transpileModule(
    fs.readFileSync("src/features/explore/categories.ts", "utf8"),
    { compilerOptions: { module: ts.ModuleKind.CommonJS } },
  ).outputText,
  moduleValue = { exports: {} };
new Function("module", "exports", code)(moduleValue, moduleValue.exports);
const c = moduleValue.exports;
test("the app lists the same six categories as the website, in the same order", () => {
  assert.deepEqual(
    c.categoryList.map((x) => x.id),
    ["history", "culture", "medical", "nature", "entertainment", "business"],
  );
  for (const x of c.categoryList) {
    assert.equal(x.label.length, 3);
    assert.ok(x.label.every((s) => s.trim() && !s.includes("·")));
  }
});
test("a journey's own categories from the API are used as they are", () => {
  assert.deepEqual(c.categoriesOf({ categories: ["medical"], image: "baku" }), [
    "medical",
  ]);
  assert.deepEqual(c.categoriesOf({ categories: [], image: "baku" }), []);
});
test("an older API without categories falls back to the picture", () => {
  assert.deepEqual(c.categoriesOf({ image: "gabala" }), ["nature"]);
  assert.ok(c.categoriesOf({ image: "baku" }).includes("entertainment"));
});
