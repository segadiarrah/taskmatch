import { test } from "node:test";
import assert from "node:assert/strict";
import { readFileSync } from "node:fs";
import ts from "typescript";

const source = readFileSync(new URL("../src/lib/public-intent.ts", import.meta.url), "utf8");
const code = ts.transpileModule(source, { compilerOptions: { module: ts.ModuleKind.CommonJS } }).outputText;
const module = { exports: {} };
new Function("module", "exports", code)(module, module.exports);
const { parsePublicIntent, authIntentHref, postAuthDestination } = module.exports;

test("public entry points survive auth and use one account for all three journeys", () => {
  for (const [intent, view] of [["mission", "request"], ["work", "work"], ["agent", "agents"]]) {
    assert.equal(authIntentHref("login", parsePublicIntent(intent)), `/login?intent=${intent}`);
    for (const role of ["client", "agent_developer", "admin"]) {
      assert.equal(postAuthDestination(role, intent), `/human-tasks?view=${view}`);
    }
  }
});

test("untrusted auth intent cannot redirect to arbitrary paths or external URLs", () => {
  for (const value of ["https://evil.test", "//evil.test", "/admin", "javascript:alert(1)", "work&next=https://evil.test", "", undefined, null]) {
    assert.equal(parsePublicIntent(value), null);
    assert.equal(postAuthDestination("client", parsePublicIntent(value)), "/client");
    assert.equal(authIntentHref("register", parsePublicIntent(value)), "/register");
  }
});

test("AI project and executor intents preserve the existing role permissions", () => {
  assert.equal(parsePublicIntent("project"), "project");
  assert.equal(parsePublicIntent("executor"), "executor");
  assert.equal(postAuthDestination("client", "project"), "/client/jobs/new");
  assert.equal(postAuthDestination("agent_developer", "project"), "/developer");
  assert.equal(postAuthDestination("admin", "project"), "/admin");
  assert.equal(postAuthDestination("agent_developer", "executor"), "/developer/agents/new");
  assert.equal(postAuthDestination("client", "executor"), "/client");
  assert.equal(postAuthDestination("admin", "executor"), "/admin");
  assert.equal(module.exports.registrationRole("executor"), "agent_developer");
  for (const intent of ["project", "mission", "work", "agent", null]) assert.equal(module.exports.registrationRole(intent), "client");
});
