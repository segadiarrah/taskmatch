"use client";

import { useCallback, useEffect, useState } from "react";
import { apiGet, apiPost, apiPut } from "@/lib/api";
import { useTranslation } from "@/lib/i18n";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Input } from "@/components/ui/input";
import {
  AlertTriangle,
  Eye,
  FileText,
  GitBranch,
  KeyRound,
  Loader2,
  PackageCheck,
  Server,
  ShieldOff,
  Table2,
} from "lucide-react";

/* -------------------------------------------------------------------------- */
/*  Types — mirror the /jobs/{id}/delivery payload                            */
/* -------------------------------------------------------------------------- */

type DeliveryMode = "document" | "repository" | "dataset" | "installation" | "hosted";

interface AccessGrant {
  id: string;
  label: string;
  kind: string;
  direction: string;
  hint: string | null;
  expires_at: string | null;
  revoked_at: string | null;
  last_accessed_at: string | null;
  access_count: number;
  max_accesses: number;
  revoked: boolean;
  expired: boolean;
  exhausted: boolean;
}

interface DeliveryPlan {
  id: string;
  mode: DeliveryMode;
  status: string;
  target: string | null;
  requirements: { needs_access?: boolean; items?: string[] };
  runbook: string | null;
  notes: string | null;
  needs_access_exchange: boolean;
  signed_off_at: string | null;
  vault_available: boolean;
  access_grants: AccessGrant[];
}

const MODE_ICONS: Record<DeliveryMode, typeof FileText> = {
  document: FileText,
  repository: GitBranch,
  dataset: Table2,
  installation: Server,
  hosted: Server,
};

// Derived from the icon map rather than repeated as a literal array: these are
// API discriminators, and one source of truth keeps the two in step.
const MODES = Object.keys(MODE_ICONS) as DeliveryMode[];

/* -------------------------------------------------------------------------- */
/*  Component                                                                 */
/* -------------------------------------------------------------------------- */

export function DeliveryPanel({ jobId }: { jobId: string }) {
  const { t } = useTranslation();
  const [plan, setPlan] = useState<DeliveryPlan | null>(null);
  const [loading, setLoading] = useState(true);
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const [target, setTarget] = useState("");
  const [newLabel, setNewLabel] = useState("");
  const [newSecret, setNewSecret] = useState("");
  const [revealed, setRevealed] = useState<Record<string, string>>({});
  const [requoteNeeded, setRequoteNeeded] = useState(false);

  const load = useCallback(async () => {
    try {
      const res = await apiGet<DeliveryPlan>(`/v1/jobs/${jobId}/delivery`);
      setPlan(res);
      setTarget(res.target ?? "");
      setError(null);
    } catch {
      setPlan(null);
    } finally {
      setLoading(false);
    }
  }, [jobId]);

  useEffect(() => {
    load();
  }, [load]);

  const setMode = async (mode: DeliveryMode) => {
    setBusy(true);
    setError(null);
    try {
      const res = await apiPut<DeliveryPlan & { requote_recommended?: boolean }>(
        `/v1/jobs/${jobId}/delivery`,
        { mode, target: target || null },
      );
      setPlan(res);
      setRequoteNeeded(Boolean(res.requote_recommended));
    } catch {
      setError(t("delivery.errorUpdate", "Could not update the delivery mode."));
    } finally {
      setBusy(false);
    }
  };

  const addGrant = async () => {
    if (!newLabel.trim() || !newSecret.trim()) return;
    setBusy(true);
    setError(null);
    try {
      await apiPost(`/v1/jobs/${jobId}/access-grants`, {
        label: newLabel,
        secret: newSecret,
        kind: "other",
      });
      // Clear the secret from component state immediately — it should live in
      // the browser for no longer than the request that carried it.
      setNewSecret("");
      setNewLabel("");
      await load();
    } catch {
      setError(t("delivery.errorGrant", "Could not store the credential."));
    } finally {
      setBusy(false);
    }
  };

  const reveal = async (grantId: string) => {
    setError(null);
    try {
      const res = await apiPost<{ secret: string }>(
        `/v1/jobs/${jobId}/access-grants/${grantId}/reveal`,
        {},
      );
      setRevealed((prev) => ({ ...prev, [grantId]: res.secret }));
      await load();
    } catch {
      setError(t("delivery.errorReveal", "This credential can no longer be revealed."));
    }
  };

  const revoke = async (grantId: string) => {
    setBusy(true);
    try {
      await apiPost(`/v1/jobs/${jobId}/access-grants/${grantId}/revoke`, {});
      setRevealed((prev) => {
        const next = { ...prev };
        delete next[grantId];
        return next;
      });
      await load();
    } catch {
      setError(t("delivery.errorRevoke", "Could not revoke the credential."));
    } finally {
      setBusy(false);
    }
  };

  const signOff = async () => {
    setBusy(true);
    try {
      await apiPost(`/v1/jobs/${jobId}/delivery/sign-off`, { notes: "" });
      setRevealed({});
      await load();
    } catch {
      setError(t("delivery.errorSignOff", "Could not confirm the handover."));
    } finally {
      setBusy(false);
    }
  };

  if (loading) {
    return (
      <Card>
        <CardContent className="flex items-center gap-3 py-6 text-sm text-muted-foreground">
          <Loader2 className="h-4 w-4 animate-spin" />
          {t("delivery.loading", "Loading the delivery plan…")}
        </CardContent>
      </Card>
    );
  }

  if (!plan) return null;

  const ModeIcon = MODE_ICONS[plan.mode] ?? FileText;
  const signedOff = Boolean(plan.signed_off_at);
  const modeLocked = signedOff;

  return (
    <Card>
      <CardHeader>
        <CardTitle className="flex items-center gap-2 text-xl">
          <PackageCheck className="h-5 w-5 text-signal-400" />
          {t("delivery.title", "Delivery & handover")}
          {signedOff && (
            <Badge variant="success" className="ml-1">
              {t("delivery.signedOff", "Signed off")}
            </Badge>
          )}
        </CardTitle>
        <CardDescription>
          {t(
            "delivery.subtitle",
            "How the finished work reaches you — a document, a repository, or installed on your own infrastructure.",
          )}
        </CardDescription>
      </CardHeader>

      <CardContent className="space-y-6">
        {error && (
          <p className="rounded-md border border-destructive/40 bg-destructive/10 p-3 text-sm text-destructive">
            {error}
          </p>
        )}

        {/* ---- Mode ---- */}
        <section>
          <h3 className="text-sm font-semibold text-ink-100">
            {t("delivery.modeTitle", "Delivery mode")}
          </h3>
          <div className="mt-2 flex flex-wrap gap-2">
            {MODES.map((mode) => {
              const Icon = MODE_ICONS[mode];
              const active = plan.mode === mode;
              return (
                <Button
                  key={mode}
                  variant={active ? "default" : "outline"}
                  size="sm"
                  disabled={busy || modeLocked}
                  onClick={() => setMode(mode)}
                  aria-pressed={active}
                >
                  <Icon className="mr-1.5 h-3.5 w-3.5" />
                  {t(`delivery.mode.${mode}`, mode)}
                </Button>
              );
            })}
          </div>

          {requoteNeeded && (
            <p className="mt-3 flex items-start gap-2 rounded-md border border-warning/40 bg-warning/10 p-3 text-xs text-ink-200">
              <AlertTriangle className="mt-0.5 h-4 w-4 shrink-0 text-warning" />
              {t(
                "delivery.requoteNotice",
                "Changing the delivery mode changes the work involved. Request a new quote so the price matches.",
              )}
            </p>
          )}

          {(plan.requirements?.items?.length ?? 0) > 0 && (
            <div className="mt-3 rounded-lg border border-border bg-ink-900/40 p-3">
              <p className="flex items-center gap-1.5 text-xs font-medium text-ink-200">
                <ModeIcon className="h-3.5 w-3.5" />
                {t("delivery.requirements", "What we need from you")}
              </p>
              <ul className="mt-1.5 space-y-0.5 text-xs text-muted-foreground">
                {plan.requirements.items?.map((item) => (
                  <li key={item}>• {item}</li>
                ))}
              </ul>
            </div>
          )}
        </section>

        {/* ---- Credentials ---- */}
        {plan.needs_access_exchange && (
          <section>
            <h3 className="flex items-center gap-1.5 text-sm font-semibold text-ink-100">
              <KeyRound className="h-4 w-4 text-signal-400" />
              {t("delivery.accessTitle", "Access credentials")}
            </h3>
            <p className="mt-1 text-xs text-muted-foreground">
              {t(
                "delivery.accessHelp",
                "Encrypted at rest, revealed a limited number of times, every access logged, and revoked automatically when you sign off.",
              )}
            </p>

            {!plan.vault_available && (
              <p className="mt-3 flex items-start gap-2 rounded-md border border-destructive/40 bg-destructive/10 p-3 text-xs text-destructive">
                <AlertTriangle className="mt-0.5 h-4 w-4 shrink-0" />
                {t(
                  "delivery.vaultUnavailable",
                  "The credential vault is not configured on this environment, so credentials cannot be stored. Contact your administrator.",
                )}
              </p>
            )}

            <div className="mt-3 space-y-2">
              {plan.access_grants.map((grant) => (
                <div
                  key={grant.id}
                  className="rounded-lg border border-border bg-ink-900/40 p-3"
                >
                  <div className="flex flex-wrap items-center gap-2">
                    <span className="min-w-0 flex-1 truncate text-sm text-ink-100">
                      {grant.label}
                    </span>
                    {grant.revoked ? (
                      <Badge variant="outline">
                        <ShieldOff className="mr-1 h-3 w-3" />
                        {t("delivery.grantRevoked", "Revoked")}
                      </Badge>
                    ) : grant.expired ? (
                      <Badge variant="warning">{t("delivery.grantExpired", "Expired")}</Badge>
                    ) : (
                      <Badge variant="outline">
                        {grant.access_count}/{grant.max_accesses}{" "}
                        {t("delivery.reveals", "reveals")}
                      </Badge>
                    )}
                    {!grant.revoked && !grant.expired && !grant.exhausted && (
                      <Button size="sm" variant="ghost" onClick={() => reveal(grant.id)}>
                        <Eye className="mr-1 h-3.5 w-3.5" />
                        {t("delivery.reveal", "Reveal")}
                      </Button>
                    )}
                    {!grant.revoked && (
                      <Button
                        size="sm"
                        variant="ghost"
                        disabled={busy}
                        onClick={() => revoke(grant.id)}
                      >
                        {t("delivery.revoke", "Revoke")}
                      </Button>
                    )}
                  </div>

                  {grant.hint && (
                    <p className="mt-1 font-mono text-xs text-muted-foreground">{grant.hint}</p>
                  )}

                  {revealed[grant.id] && (
                    <pre className="mt-2 overflow-x-auto rounded border border-warning/40 bg-warning/10 p-2 font-mono text-xs text-ink-100">
                      {revealed[grant.id]}
                    </pre>
                  )}
                </div>
              ))}
            </div>

            {!signedOff && plan.vault_available && (
              <div className="mt-3 rounded-lg border border-border p-3">
                <p className="text-xs font-medium text-ink-200">
                  {t("delivery.addGrant", "Share a credential")}
                </p>
                <div className="mt-2 flex flex-col gap-2 sm:flex-row">
                  <Input
                    value={newLabel}
                    onChange={(e) => setNewLabel(e.target.value)}
                    placeholder={t("delivery.grantLabel", "What is it for")}
                    aria-label={t("delivery.grantLabel", "What is it for")}
                  />
                  <Input
                    type="password"
                    value={newSecret}
                    onChange={(e) => setNewSecret(e.target.value)}
                    placeholder={t("delivery.grantSecret", "Credential")}
                    aria-label={t("delivery.grantSecret", "Credential")}
                    autoComplete="off"
                  />
                  <Button
                    onClick={addGrant}
                    disabled={busy || !newLabel.trim() || !newSecret.trim()}
                    className="shrink-0"
                  >
                    {t("delivery.store", "Store securely")}
                  </Button>
                </div>
              </div>
            )}
          </section>
        )}

        {/* ---- Sign-off ---- */}
        {!signedOff && (
          <section className="rounded-lg border border-border p-4">
            <p className="text-xs text-muted-foreground">
              {t(
                "delivery.signOffHelp",
                "Confirm the delivery landed. Every credential you shared is revoked immediately.",
              )}
            </p>
            <div className="mt-3 flex justify-end">
              <Button onClick={signOff} disabled={busy}>
                {t("delivery.signOffAction", "Confirm handover")}
              </Button>
            </div>
          </section>
        )}
      </CardContent>
    </Card>
  );
}

export default DeliveryPanel;
