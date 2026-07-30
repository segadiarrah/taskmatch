#!/usr/bin/env python3
"""End-to-end pipeline smoke test for TaskMatch.ai (hits a running instance).

Exercises the full client path against a live API and prints PASS/FAIL per step:
  login -> create job -> submit -> poll plan -> assert spec + tasks + matched
  executors appear (auto-planned by the MCP pipeline).

Usage:
  BASE=http://127.0.0.1:8091 python backend/scripts/e2e_smoke.py
  (BASE defaults to http://127.0.0.1:8091; append /api/v1 is handled here.)
"""
from __future__ import annotations

import json
import os
import sys
import time
import urllib.error
import urllib.parse
import urllib.request

BASE = os.environ.get("BASE", "http://127.0.0.1:8091").rstrip("/") + "/api/v1"
CLIENT = os.environ.get("SMOKE_CLIENT", "client1@example.com")
PASSWORD = os.environ.get("SMOKE_PASSWORD", "password123")
FAILS: list[str] = []


def _req(method, path, token=None, body=None, form=None, timeout=60):
    headers = {}
    data = None
    if token:
        headers["Authorization"] = f"Bearer {token}"
    if body is not None:
        data = json.dumps(body).encode()
        headers["Content-Type"] = "application/json"
    if form is not None:
        data = urllib.parse.urlencode(form).encode()
        headers["Content-Type"] = "application/x-www-form-urlencoded"
    req = urllib.request.Request(BASE + path, data=data, headers=headers, method=method)
    try:
        with urllib.request.urlopen(req, timeout=timeout) as resp:
            raw = resp.read().decode()
            return resp.status, (json.loads(raw) if raw else {})
    except urllib.error.HTTPError as exc:
        return exc.code, exc.read().decode()[:200]


def check(name, ok, detail=""):
    print(f"  [{'OK' if ok else 'FAIL'}] {name}{(' — ' + detail) if detail else ''}")
    if not ok:
        FAILS.append(name)


print(f"=== TaskMatch.ai e2e smoke @ {BASE} ===")
st, tok = _req("POST", "/auth/login", form={"username": CLIENT, "password": PASSWORD})
token = tok.get("access_token") if isinstance(tok, dict) else None
check("login", bool(token))
if not token:
    sys.exit(1)

st, job = _req("POST", "/jobs", token, {
    "title": "Smoke: analytics dashboard",
    "raw_description": "Build a REST API that ingests events, compute retention and funnel metrics, expose them via an endpoint, add tests and a deploy guide.",
    "budget_min": 2000, "budget_max": 6000, "currency": "EUR",
})
jid = job.get("id") if isinstance(job, dict) else None
check("create job", bool(jid), str(job)[:80] if not jid else jid[:8])
if not jid:
    sys.exit(1)

st, sub = _req("POST", f"/jobs/{jid}/submit", token)
check("submit (fast, background planning)", st == 200, f"status={sub.get('status') if isinstance(sub, dict) else sub}")

plan = {}
for _ in range(25):
    st, plan = _req("GET", f"/jobs/{jid}/plan", token)
    if isinstance(plan, dict) and plan.get("ready"):
        break
    time.sleep(3)

check("plan ready", isinstance(plan, dict) and plan.get("ready") is True)
if isinstance(plan, dict) and plan.get("ready"):
    spec = plan.get("spec", {})
    tasks = plan.get("tasks", [])
    check("spec has objective", bool(spec.get("objective")))
    check("decomposed into tasks", len(tasks) >= 1, f"{len(tasks)} tasks")
    check("executors matched", any(t.get("matched_agents") for t in tasks))

print("=" * 48)
if FAILS:
    print(f"RESULT: {len(FAILS)} FAILED -> {FAILS}")
    sys.exit(1)
print("RESULT: all pipeline steps passed ✅")
