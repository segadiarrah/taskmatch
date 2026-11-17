import { test } from "node:test";
import assert from "node:assert/strict";
import { readFileSync } from "node:fs";
import { createRequire } from "node:module";
import ts from "typescript";

const code = ts.transpileModule(readFileSync(new URL("../src/lib/utils.ts", import.meta.url), "utf8"), {
  compilerOptions: { module: ts.ModuleKind.CommonJS, target: ts.ScriptTarget.ES2020 },
}).outputText;
const module = { exports: {} };
const require = createRequire(import.meta.url);
const displayCode = ts.transpileModule(readFileSync(new URL("../src/lib/display-copy.ts", import.meta.url), "utf8"), {compilerOptions:{module:ts.ModuleKind.CommonJS}}).outputText;
const display = {exports:{}};new Function("module","exports",displayCode)(display,display.exports);
new Function("require", "module", "exports", code)(name=>name==="@/lib/display-copy"?display.exports:require(name), module, module.exports);
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


test("dates and statuses follow the selected locale without changing amounts", () => {
  const { formatCurrency }=module.exports;
  assert.equal(formatStatus("client_review","pt"),"Revisão do cliente");
  assert.equal(formatStatus("approved","zh"),"已批准");
  assert.notEqual(formatDate("2026-09-24T12:00:00Z","pt"),formatDate("2026-09-24T12:00:00Z","en"));
  assert.equal(formatCurrency(1234.5,"EUR","pt"),new Intl.NumberFormat("pt",{style:"currency",currency:"EUR",minimumFractionDigits:0,maximumFractionDigits:2}).format(1234.5));
});
