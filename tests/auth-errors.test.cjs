const { test } = require("node:test"),
  assert = require("node:assert/strict"),
  fs = require("node:fs"),
  ts = require("typescript");
const code = ts.transpileModule(
    fs.readFileSync("src/features/account/auth-errors.ts", "utf8"),
    { compilerOptions: { module: ts.ModuleKind.CommonJS } },
  ).outputText,
  moduleValue = { exports: {} };
new Function("module", "exports", code)(moduleValue, moduleValue.exports);
const { authMessage } = moduleValue.exports;
const en = (a, _r, _z) => a;
test("a wrong password says so and does not talk about registration", () => {
  const m = authMessage({ status: 401, code: "INVALID_CREDENTIALS" }, "login", en);
  assert.match(m, /not correct/);
  assert.doesNotMatch(m, /name|12/);
});
test("an email that cannot be used for a new account points to sign in", () => {
  const m = authMessage({ status: 409, code: "ACCOUNT_UNAVAILABLE" }, "register", en);
  assert.match(m, /sign in or reset/);
});
test("a missing server, a busy limit and a server error each get their own message", () => {
  assert.match(authMessage({ status: null, code: "" }, "login", en), /Cannot reach/);
  assert.match(authMessage({ status: 429, code: "TOO_MANY_ATTEMPTS" }, "login", en), /wait/);
  assert.match(authMessage({ status: 503, code: "X" }, "register", en), /our side/);
});
test("a rejected sign-up that is none of those lists what to check, without a phone number", () => {
  const m = authMessage({ status: 400, code: "REQUEST_FAILED" }, "register", en);
  assert.match(m, /name/);
  assert.doesNotMatch(m, /phone/i);
});
test("every message has three languages and no middle dot", () => {
  for (const [status, mode] of [[401, "login"], [409, "register"], [null, "login"], [429, "login"], [500, "register"], [400, "register"]]) {
    const seen = [];
    authMessage({ status, code: "" }, mode, (a, r, z) => (seen.push(a, r, z), a));
    assert.ok(seen.every((s) => s.trim().length && !s.includes("·")));
  }
});
