"use client";
import { useCallback, useEffect, useState } from "react";
import Link from "next/link";
import { apiDelete, apiGet, apiPost } from "@/lib/api";
import { stripeUrl } from "@/lib/billing";
import { humanCopy } from "@/lib/human-copy";
import { useTranslation } from "@/lib/i18n";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import {
  Field,
  labelFor,
  LoadError,
  money,
  panel,
  safeError,
  selectStyle,
  StateTag,
  type Action,
  type Category,
} from "./shared";
import { WebhooksPanel } from "./webhooks-panel";
interface Agent {
  id: string;
  name: string;
  status: string;
}
interface Mandate {
  id: string;
  principal_id: string;
  agent_name: string;
  max_amount_minor: number;
  reserved_amount_minor: number;
  expires_at: string;
  status: string;
  categories: string[];
}
interface Principal {
  id: string;
  kind: string;
}
export function AgentsPanel({
  categories,
  name,
  busy,
  act,
}: {
  categories: Category[];
  name: string;
  busy: boolean;
  act: Action;
}) {
  const { locale, t } = useTranslation();
  const c = humanCopy[locale];
  const [now] = useState(() => Date.now());
  const [agents, setAgents] = useState<Agent[]>([]);
  const [mandates, setMandates] = useState<Mandate[]>([]);
  const [principal, setPrincipal] = useState<Principal | null>(null);
  const [ready, setReady] = useState(false);
  const [token, setToken] = useState("");
  const [error, setError] = useState("");
  const [loading, setLoading] = useState(true);
  const load = useCallback(async () => {
    setLoading(true);
    setError("");
    try {
      const [a, d, p] = await Promise.all([
        apiGet<{ items: Agent[] }>("/v1/worker-portal/agents"),
        apiGet<{ items: Mandate[] }>("/v1/worker-portal/delegations"),
        apiGet<Principal[]>("/v1/principals"),
      ]);
      setAgents(a.items);
      setMandates(d.items);
      const own = p.find((x) => x.kind === "individual") || null;
      setPrincipal(own);
      if (own)
        setReady(
          (
            await apiGet<{ ready: boolean }>(
              `/v1/principals/${own.id}/payment-method`,
            )
          ).ready,
        );
    } catch (e) {
      setError(safeError(e, c.error));
    } finally {
      setLoading(false);
    }
  }, [c.error]);
  useEffect(() => {
    void load();
  }, [load]);
  async function ownPrincipal() {
    if (principal) return principal;
    const p = await apiPost<Principal>("/v1/principals", {
      kind: "individual",
      display_name: name,
    });
    setPrincipal(p);
    return p;
  }
  if (loading) return <section className={panel}>{t("human.loading")}</section>;
  return (
    <div className="space-y-6">
      <p className="max-w-3xl text-sm leading-6 text-ink-400">{c.agentIntro}</p>
      {error && <LoadError error={error} retry={() => void load()} />}
      {token && (
        <div
          role="status"
          className="space-y-4 rounded-xl border border-signal-300 bg-signal-50 p-5"
        >
          <p className="text-sm font-medium">{c.token}</p>
          <textarea
            aria-label={c.token}
            className="min-h-28 w-full break-all rounded-lg border border-signal-300 bg-white p-3 font-mono text-xs"
            readOnly
            value={token}
          />
          <Button onClick={() => setToken("")}>{c.dismiss}</Button>
        </div>
      )}
      <div className="grid gap-6 lg:grid-cols-2">
        <form
          className={`${panel} space-y-5`}
          onSubmit={(e) => {
            e.preventDefault();
            const f = new FormData(e.currentTarget);
            void act(async () => {
              await apiPost("/v1/worker-portal/agents", {
                name: f.get("name"),
                endpoint_url: f.get("endpoint"),
                executor_kind: "agent",
              });
              await load();
            });
          }}
        >
          <h2 className="text-xl font-semibold">{c.addAgent}</h2>
          <Field label={c.agentName}>
            <Input name="name" required maxLength={256} />
          </Field>
          <Field label={c.endpoint}>
            <Input name="endpoint" type="url" pattern="https://.*" required />
          </Field>
          <Button disabled={busy}>{c.addAgent}</Button>
          <p className="text-xs">
            <Link
              className="text-signal-700 underline underline-offset-4"
              href="/resources/api-reference"
            >
              {c.protocolDocs}
            </Link>
          </p>
        </form>
        <form
          className={`${panel} space-y-5`}
          onSubmit={(e) => {
            e.preventDefault();
            const f = new FormData(e.currentTarget);
            void act(async () => {
              const p = await ownPrincipal();
              const d = await apiPost<{ access_token: string }>(
                `/v1/principals/${p.id}/delegations`,
                {
                  agent_id: f.get("agent"),
                  max_amount_minor: Math.round(Number(f.get("budget")) * 100),
                  categories: f.getAll("categories"),
                  expires_at: new Date(String(f.get("expires"))).toISOString(),
                },
              );
              setToken(d.access_token);
              await load();
            });
          }}
        >
          <h2 className="text-xl font-semibold">{c.delegation}</h2>
          {!agents.length ? (
            <p className="text-sm text-ink-400">{c.noAgents}</p>
          ) : (
            <>
              <Field label={c.agentName}>
                <select className={selectStyle} name="agent" required>
                  {agents
                    .filter((a) => a.status === "active")
                    .map((a) => (
                      <option key={a.id} value={a.id}>
                        {a.name}
                      </option>
                    ))}
                </select>
              </Field>
              <div className="grid gap-4 sm:grid-cols-2">
                <Field label={c.spending}>
                  <Input
                    type="number"
                    name="budget"
                    defaultValue="50"
                    min="1.1"
                    max="1000000"
                    step=".01"
                    required
                  />
                </Field>
                <Field label={c.expires}>
                  <Input
                    type="datetime-local"
                    name="expires"
                    required
                    min={new Date(now + 60000).toISOString().slice(0, 16)}
                    max={new Date(now + 90 * 86400000)
                      .toISOString()
                      .slice(0, 16)}
                  />
                </Field>
              </div>
              <fieldset>
                <legend className="mb-3 text-sm font-medium">
                  {c.categories}
                </legend>
                <div className="grid gap-3 sm:grid-cols-2">
                  {categories.map((category) => (
                    <label
                      key={category.id}
                      className="flex items-start gap-2 text-sm"
                    >
                      <input
                        className="mt-1"
                        type="checkbox"
                        name="categories"
                        value={category.id}
                      />
                      {labelFor(category, locale)}
                    </label>
                  ))}
                </div>
              </fieldset>
              <Button disabled={busy}>{c.createDelegation}</Button>
            </>
          )}
        </form>
      </div>
      <section className={`${panel} space-y-5`}>
        <h2 className="text-xl font-semibold">{c.setupPayment}</h2>
        <p className="max-w-3xl text-sm leading-6 text-ink-400">
          {c.paymentIntro}
        </p>
        {ready ? (
          <>
            <p className="text-sm text-signal-700">{c.paymentReady}</p>
            <Button
              variant="outline"
              disabled={busy}
              onClick={() =>
                void act(async () => {
                  if (principal)
                    await apiDelete(
                      `/v1/principals/${principal.id}/payment-method`,
                    );
                  await load();
                })
              }
            >
              {c.paymentRevoke}
            </Button>
          </>
        ) : (
          <form
            className="space-y-4"
            onSubmit={(e) => {
              e.preventDefault();
              void act(async () => {
                const p = await ownPrincipal();
                const r = await apiPost<{ url: string; status?: string }>(
                  `/v1/principals/${p.id}/payment-method/setup`,
                  { allow_agent_payments: true },
                );
                if (r.status === "active") { await load(); return; }
                const url = stripeUrl(r.url);
                if (!url) throw new Error(c.error);
                window.location.assign(url);
              });
            }}
          >
            <label className="flex max-w-3xl items-start gap-3 text-sm">
              <input className="mt-1" type="checkbox" required />
              {c.permissionPayment}
            </label>
            <div className="flex flex-wrap gap-3">
              <Button disabled={busy}>{c.setupPayment}</Button>
              {principal && (
                <Button
                  type="button"
                  variant="outline"
                  disabled={busy}
                  onClick={() =>
                    void act(async () => {
                      await apiPost(
                        `/v1/principals/${principal.id}/payment-method/confirm`,
                        {},
                      );
                      await load();
                    })
                  }
                >
                  {c.paymentConfirm}
                </Button>
              )}
            </div>
          </form>
        )}
      </section>
      <WebhooksPanel
        principalId={principal?.id || null}
        ensurePrincipal={ownPrincipal}
        mandates={mandates}
        busy={busy}
        act={act}
      />
      {!!mandates.length && (
        <section className={panel}>
          <h2 className="mb-5 text-xl font-semibold">{c.mandates}</h2>
          <div className="divide-y divide-ink-800">
            {mandates.map((d) => (
              <article
                className="flex flex-wrap items-center justify-between gap-5 py-5"
                key={d.id}
              >
                <div>
                  <h3 className="font-medium">{d.agent_name}</h3>
                  <p className="mt-2 text-sm text-ink-400">
                    {c.total}: {money(d.max_amount_minor, "EUR", locale)} ·{" "}
                    {c.reserved}:{" "}
                    {money(d.reserved_amount_minor, "EUR", locale)}
                  </p>
                  <p className="mt-1 text-xs text-ink-400">
                    {new Date(d.expires_at).toLocaleString(locale)}
                  </p>
                </div>
                <div className="flex items-center gap-3">
                  <StateTag value={d.status} />
                  {d.status === "active" && (
                    <Button
                      variant="outline"
                      disabled={busy}
                      onClick={() =>
                        void act(async () => {
                          await apiDelete(
                            `/v1/principals/${d.principal_id}/delegations/${d.id}`,
                          );
                          await load();
                        })
                      }
                    >
                      {c.revoke}
                    </Button>
                  )}
                </div>
              </article>
            ))}
          </div>
        </section>
      )}
    </div>
  );
}
