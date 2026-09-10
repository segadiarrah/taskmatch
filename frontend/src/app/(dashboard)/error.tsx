"use client";

import React from "react";
import { Button } from "@/components/ui/button";
import { AlertTriangle } from "lucide-react";
import { useTranslation } from "@/lib/i18n";

export default function DashboardError({
  error,
  reset,
}: {
  error: Error & { digest?: string };
  reset: () => void;
}) {
  const { t } = useTranslation();
  return (
    <div className="flex min-h-[50vh] items-center justify-center p-6">
      <div className="mx-auto w-full max-w-md rounded-lg border border-ink-700 bg-ink-900 p-8 text-center shadow-panel">
        <div className="mx-auto flex h-14 w-14 items-center justify-center rounded-full border border-danger/40 bg-danger/10">
          <AlertTriangle className="h-7 w-7 text-danger" />
        </div>
        <h2 className="mt-4 font-display text-xl font-medium text-ink-50">{t("dashboard.crashTitle")}</h2>
        <p className="mt-2 text-sm text-ink-400">
          {t("dashboard.crashBody")}
        </p>
        {error.digest && (
          <p className="mt-2 font-mono text-xs text-ink-500">{t("dashboard.crashErrorId")} {error.digest}</p>
        )}
        <div className="mt-6 flex items-center justify-center gap-3">
          <Button
            onClick={reset}
            className="bg-signal-500 text-ink-950 hover:bg-signal-400 hover:shadow-glow-sm"
          >
            {t("dashboard.crashRetry")}
          </Button>
          <Button variant="outline" onClick={() => (window.location.href = "/")}>
            {t("dashboard.crashHome")}
          </Button>
        </div>
      </div>
    </div>
  );
}
