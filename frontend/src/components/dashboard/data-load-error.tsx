"use client";

import React from "react";
import { AlertTriangle, RotateCw } from "lucide-react";

import { useTranslation } from "@/lib/i18n";

/**
 * Shown when a dashboard page could not load its data.
 *
 * It exists because the admin pages used to answer a failed request with
 * fabricated rows — invented payments, invented agents, invented audit entries
 * — served without any indication that the backend had not answered. On a
 * platform whose selling point is an auditable decision log, an audit page that
 * invents entries when it cannot reach the server is worse than a blank one:
 * the reviewer has no way to tell the difference, and the numbers look real.
 *
 * Silence would be safer but still wrong, because "no data" and "we could not
 * ask" are different facts and only one of them needs acting on. So the page
 * says which it is, and offers to try again.
 */
export function DataLoadError({ onRetry }: { onRetry?: () => void }) {
  const { t } = useTranslation();

  return (
    <div
      role="alert"
      className="flex flex-col items-center justify-center rounded-lg border border-danger/30 bg-danger/5 px-6 py-14 text-center"
    >
      <AlertTriangle className="h-8 w-8 text-danger" aria-hidden="true" />
      <p className="mt-4 text-base font-medium text-ink-100">{t("dashboard.loadErrorTitle")}</p>
      <p className="mt-2 max-w-md text-sm leading-6 text-ink-400">{t("dashboard.loadErrorBody")}</p>
      {onRetry ? (
        <button
          type="button"
          onClick={onRetry}
          className="mt-6 inline-flex h-10 items-center gap-2 rounded-md border border-ink-700 px-5 text-sm font-medium text-ink-200 transition-colors hover:border-signal-500/50 hover:text-ink-50"
        >
          <RotateCw className="h-4 w-4" aria-hidden="true" />
          {t("dashboard.retry")}
        </button>
      ) : null}
    </div>
  );
}
