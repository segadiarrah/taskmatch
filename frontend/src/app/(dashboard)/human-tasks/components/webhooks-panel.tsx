"use client";

import { useCallback, useEffect, useState } from "react";
import { apiDelete, apiGet, apiPost } from "@/lib/api";
import { humanCopy } from "@/lib/human-copy";
import { useTranslation } from "@/lib/i18n";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import {
  Field,
  LoadError,
  panel,
  safeError,
  selectStyle,
  StateTag,
  type Action,
} from "./shared";

interface Subscription {
  id: string;
  url: string;
  active: boolean;
  delegation_id: string | null;
}
interface Delivery {
  id: string;
  status: string;
  attempts: number;
  next_attempt_at: string | null;
  delivered_at: string | null;
  last_http_status: number | null;
}
export function WebhooksPanel({
  principalId,
  ensurePrincipal,
  mandates,
  busy,
  act,
}: {
  principalId: string | null;
  ensurePrincipal: () => Promise<{ id: string }>;
  mandates: { id: string; agent_name: string; status: string }[];
  busy: boolean;
  act: Action;
}) {
  const { locale } = useTranslation();
  const c = humanCopy[locale];
  const [subscriptions, setSubscriptions] = useState<Subscription[]>([]);
  const [secret, setSecret] = useState("");
  const [deliveries, setDeliveries] = useState<Record<string, Delivery[]>>({});
  const [error, setError] = useState("");
  const load = useCallback(async () => {
    setError("");
    if (!principalId) {
      setSubscriptions([]);
      return;
    }
    try {
      setSubscriptions(
        await apiGet<Subscription[]>(`/v1/principals/${principalId}/webhooks`),
      );
    } catch (e) {
      setError(safeError(e, c.error));
    }
  }, [principalId, c.error]);
  useEffect(() => {
    void load();
  }, [load]);
  async function history(id: string) {
    if (!principalId) return;
    setError("");
    try {
      const rows = await apiGet<Delivery[]>(
        `/v1/principals/${principalId}/webhooks/${id}/deliveries`,
      );
      setDeliveries((old) => ({ ...old, [id]: rows }));
    } catch (e) {
      setError(safeError(e, c.error));
    }
  }
  return (
    <section className={`${panel} space-y-5`}>
      <div>
        <h2 className="text-xl font-semibold">{c.webhookTitle}</h2>
        <p className="mt-3 max-w-3xl text-sm leading-6 text-ink-400">
          {c.webhookIntro}
        </p>
      </div>
      {error && <LoadError error={error} retry={() => void load()} />}
      {secret && (
        <div className="space-y-3 rounded-lg border border-signal-300 bg-signal-50 p-4">
          <p className="text-sm">{c.secretOnce}</p>
          <Field label={c.signingSecret}>
            <Input readOnly value={secret} className="font-mono" />
          </Field>
          <Button type="button" onClick={() => setSecret("")}>
            {c.secretSaved}
          </Button>
        </div>
      )}
      <form
        className="grid gap-4 md:grid-cols-[1fr_1fr_auto] md:items-end"
        onSubmit={(e) => {
          e.preventDefault();
          const f = new FormData(e.currentTarget);
          void act(async () => {
            const p = await ensurePrincipal();
            const result = await apiPost<Subscription & { secret: string }>(
              `/v1/principals/${p.id}/webhooks`,
              { url: f.get("url"), delegation_id: f.get("delegation") || null },
            );
            setSecret(result.secret);
            setSubscriptions(
              await apiGet<Subscription[]>(`/v1/principals/${p.id}/webhooks`),
            );
          });
        }}
      >
        <Field label={c.webhookUrl}>
          <Input
            name="url"
            type="url"
            pattern="https://.*"
            required
            maxLength={2048}
          />
        </Field>
        <Field label={c.webhookScope}>
          <select name="delegation" className={selectStyle} defaultValue="">
            <option value="">{c.allMandates}</option>
            {mandates
              .filter((m) => m.status === "active")
              .map((m) => (
                <option key={m.id} value={m.id}>
                  {m.agent_name}
                </option>
              ))}
          </select>
        </Field>
        <Button disabled={busy}>{c.enableNotifications}</Button>
      </form>
      {!!subscriptions.length && (
        <div className="divide-y divide-ink-800">
          {subscriptions.map((s) => (
            <article key={s.id} className="space-y-3 py-5">
              <div className="flex flex-wrap items-center justify-between gap-4">
                <p className="min-w-0 break-all text-sm">{s.url}</p>
                <div className="flex flex-wrap items-center gap-3">
                  <StateTag value={s.active ? "active" : "revoked"} />
                  <Button
                    variant="outline"
                    type="button"
                    onClick={() => void history(s.id)}
                  >
                    {c.deliveries}
                  </Button>
                  {s.active && (
                    <Button
                      type="button"
                      variant="outline"
                      disabled={busy}
                      onClick={() =>
                        void act(async () => {
                          if (principalId)
                            await apiDelete(
                              `/v1/principals/${principalId}/webhooks/${s.id}`,
                            );
                          await load();
                        })
                      }
                    >
                      {c.disableNotifications}
                    </Button>
                  )}
                </div>
              </div>
              {deliveries[s.id] && (
                <div className="space-y-2 rounded-lg bg-ink-950 p-4">
                  {!deliveries[s.id].length ? (
                    <p className="text-sm text-ink-400">{c.noDeliveries}</p>
                  ) : (
                    deliveries[s.id].map((d) => (
                      <div
                        key={d.id}
                        className="flex flex-wrap items-center justify-between gap-3 text-xs text-ink-400"
                      >
                        <span>
                          {d.status === "suppressed"
                            ? c.deliverySuppressed
                            : d.status === "delivered"
                              ? c.delivered
                              : d.status === "failed"
                                ? c.failedDelivery
                                : c.pendingDelivery}
                        </span>
                        <span>
                          {c.attempts}: {d.attempts}
                          {d.last_http_status !== null && <> · {"HTTP"} {d.last_http_status}</>}
                        </span>
                        <span>
                          {d.delivered_at
                            ? new Date(d.delivered_at).toLocaleString(locale)
                            : d.next_attempt_at
                              ? new Date(d.next_attempt_at).toLocaleString(
                                  locale,
                                )
                              : ""}
                        </span>
                      </div>
                    ))
                  )}
                </div>
              )}
            </article>
          ))}
        </div>
      )}
    </section>
  );
}
