import { test } from "node:test";
import assert from "node:assert/strict";
import { readFileSync } from "node:fs";
import { createRequire } from "node:module";
import ts from "typescript";

const code = ts.transpileModule(readFileSync(new URL("../src/lib/utils.ts", import.meta.url), "utf8"), {
  compilerOptions: { module: ts.ModuleKind.CommonJS, target: ts.ScriptTarget.ES2020 },
}).outputText;
const module = { exports: {} };
new Function("require", "module", "exports", code)(createRequire(import.meta.url), module, module.exports);
const { formatDate, formatDateTime, timeAgo, formatStatus } = module.exports;

test("optional or invalid dates never crash dashboards or invent a date", () => {
  for (const value of [null, undefined, "", "not-a-date", new Date(NaN)]) {
    assert.equal(formatDate(value), "—");
    assert.equal(formatDateTime(value), "—");
    assert.equal(timeAgo(value), "—");
  }
});

test("valid dates and statuses retain their display", () => {
  assert.match(formatDate("2026-09-24T12:00:00Z"), /2026/);
  assert.equal(formatStatus("client_review"), "Client Review");
});
