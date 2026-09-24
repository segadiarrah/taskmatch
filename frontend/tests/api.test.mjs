import { test, beforeEach } from "node:test";
import assert from "node:assert/strict";
import { readFileSync } from "node:fs";
import ts from "typescript";

const code = ts.transpileModule(readFileSync(new URL("../src/lib/api.ts", import.meta.url), "utf8"), {
  compilerOptions: { module: ts.ModuleKind.ESNext, target: ts.ScriptTarget.ES2020 },
}).outputText;
const api = await import(`data:text/javascript;base64,${Buffer.from(code).toString("base64")}`);

beforeEach(() => {
  const storage = new Map([["auth_token", "test-token"]]);
  globalThis.localStorage = {
    getItem: (key) => storage.get(key) ?? null,
    setItem: (key, value) => storage.set(key, value),
    removeItem: (key) => storage.delete(key),
  };
  globalThis.window = { location: { pathname: "/client", search: "", href: "" }, dispatchEvent() {} };
});

test("custom Headers preserve authorization and JSON content type", async () => {
  globalThis.fetch = async (_url, init) => {
    const headers = new Headers(init.headers);
    assert.equal(headers.get("Authorization"), "Bearer test-token");
    assert.equal(headers.get("X-Test"), "yes");
    assert.equal(headers.get("Content-Type"), "application/json");
    return Response.json({ ok: true });
  };
  await api.apiPost("/v1/jobs", { title: "Test" }, { headers: new Headers({ "X-Test": "yes" }) });
});

test("validation errors identify the field instead of displaying object Object", async () => {
  globalThis.fetch = async () => Response.json({ detail: [{ loc: ["body", "password"], msg: "String should have at least 8 characters" }] }, { status: 422 });
  await assert.rejects(api.apiPost("/v1/auth/register", {}), /password: String should have at least 8 characters/);
});

test("network and server failures preserve the session", async () => {
  globalThis.fetch = async () => Response.json({ detail: "Unavailable" }, { status: 503 });
  await assert.rejects(api.apiGet("/v1/jobs"), /Unavailable/);
  assert.equal(localStorage.getItem("auth_token"), "test-token");
});

test("unauthorized response clears credentials and redirects to login", async () => {
  globalThis.fetch = async () => Response.json({ detail: "Expired" }, { status: 401 });
  await assert.rejects(api.apiGet("/v1/jobs"), /Expired/);
  assert.equal(localStorage.getItem("auth_token"), null);
  assert.equal(window.location.href, "/login");
});

test("a delayed unauthorized response preserves a newer login", async () => {
  let finishRequest;
  globalThis.fetch = () => new Promise((resolve) => { finishRequest = resolve; });
  const request = api.apiGet("/v1/jobs");
  localStorage.setItem("auth_token", "new-token");
  finishRequest(Response.json({ detail: "Expired" }, { status: 401 }));
  await assert.rejects(request, /Expired/);
  assert.equal(localStorage.getItem("auth_token"), "new-token");
  assert.equal(window.location.href, "");
});

test("empty successful responses are accepted", async () => {
  globalThis.fetch = async () => new Response(null, { status: 204 });
  assert.equal(await api.apiDelete("/v1/agents/test"), undefined);
});
