"use client";

import React from "react";
import { useTranslation } from "@/lib/i18n";

const COPY: Record<"en" | "fr" | "es" | "zh", { title: string; sub: string }> = {
  en: { title: "Loading", sub: "Preparing your view…" },
  fr: { title: "Chargement", sub: "Préparation de votre vue…" },
  es: { title: "Cargando", sub: "Preparando tu vista…" },
  zh: { title: "加载中", sub: "正在准备您的视图…" },
};

export default function Loading() {
  const { locale } = useTranslation();
  const c = COPY[locale] ?? COPY.en;

  return (
    <div className="surface-dark relative flex min-h-screen items-center justify-center overflow-hidden bg-canvas px-4">
      <div className="pointer-events-none absolute inset-0 lime-radial" />
      <div className="pointer-events-none absolute inset-x-0 top-0 h-[420px] grid-bg" />
      <div className="relative flex flex-col items-center gap-7 text-center">
        <div className="relative flex h-16 w-16 items-center justify-center">
          <span className="absolute inline-flex h-full w-full animate-ping rounded-full bg-accent-lime opacity-20" />
          <span className="relative inline-flex h-11 w-11 animate-spin rounded-full border-2 border-line-strong border-t-[var(--accent-lime)]" />
        </div>
        <div>
          <div className="font-display text-2xl font-semibold tracking-tight text-ink">{c.title}</div>
          <p className="mt-2 font-mono text-sm text-ink-muted">{c.sub}</p>
        </div>
      </div>
    </div>
  );
}
