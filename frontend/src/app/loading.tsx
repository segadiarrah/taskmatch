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
    <div className="flex min-h-screen items-center justify-center bg-white px-4">
      <div className="flex flex-col items-center gap-7 text-center">
        <span className="inline-flex h-10 w-10 animate-spin rounded-full border-2 border-stone-200 border-t-brand-700" />
        <div>
          <div className="text-2xl font-semibold tracking-tight text-stone-900">{c.title}</div>
          <p className="mt-2 text-sm text-stone-500">{c.sub}</p>
        </div>
      </div>
    </div>
  );
}
