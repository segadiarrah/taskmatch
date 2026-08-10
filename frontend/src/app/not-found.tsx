"use client";

import React from "react";
import Link from "next/link";
import { ArrowRight, Home } from "lucide-react";
import { useTranslation } from "@/lib/i18n";

const COPY: Record<
  "en" | "fr" | "es" | "zh",
  { eyebrow: string; title: string; body: string; home: string; docs: string }
> = {
  en: {
    eyebrow: "Error 404",
    title: "This page took a wrong turn.",
    body: "The page you were looking for does not exist or may have moved. Let us get you back to somewhere useful.",
    home: "Back to home",
    docs: "Read the docs",
  },
  fr: {
    eyebrow: "Erreur 404",
    title: "Cette page a pris un mauvais virage.",
    body: "La page que vous cherchez n’existe pas ou a peut-être été déplacée. Revenons à un endroit utile.",
    home: "Retour à l’accueil",
    docs: "Lire la documentation",
  },
  es: {
    eyebrow: "Error 404",
    title: "Esta página se perdió por el camino.",
    body: "La página que buscabas no existe o puede haberse movido. Volvamos a un lugar útil.",
    home: "Volver al inicio",
    docs: "Leer la documentación",
  },
  zh: {
    eyebrow: "错误 404",
    title: "这个页面走错了方向。",
    body: "您要找的页面不存在或可能已被移动。让我们带您回到有用的地方。",
    home: "返回首页",
    docs: "阅读文档",
  },
};

export default function NotFound() {
  const { locale } = useTranslation();
  const c = COPY[locale] ?? COPY.en;

  return (
    <div className="relative flex min-h-screen items-center justify-center overflow-hidden bg-ink-950 px-4 text-ink-50">
      <div className="pointer-events-none absolute inset-0 bg-grid" aria-hidden="true" />
      <div className="pointer-events-none absolute inset-0 bg-signal-glow" aria-hidden="true" />
      <div className="corner-brackets relative w-full max-w-lg rounded-lg border border-ink-700 bg-ink-900 p-10 text-center shadow-panel">
        <div className="eyebrow text-signal-400">{c.eyebrow}</div>
        <div className="mt-4 font-display text-8xl font-medium leading-none text-signal-500 text-glow">404</div>
        <h1 className="mt-6 font-display text-3xl font-medium tracking-tight text-ink-50">{c.title}</h1>
        <p className="mx-auto mt-4 max-w-sm font-mono text-xs leading-6 text-ink-400">{c.body}</p>
        <div className="mt-8 flex flex-col items-center justify-center gap-3 sm:flex-row">
          <Link
            href="/"
            className="inline-flex h-12 items-center justify-center gap-2 rounded-md bg-signal-500 px-7 text-sm font-semibold text-ink-950 transition-all hover:bg-signal-400 hover:shadow-glow"
          >
            <Home className="h-4 w-4" />
            {c.home}
          </Link>
          <Link
            href="/resources/documentation"
            className="inline-flex h-12 items-center justify-center gap-2 rounded-md border border-ink-600 bg-transparent px-7 text-sm font-medium text-ink-100 transition-colors hover:border-ink-400 hover:bg-ink-800"
          >
            {c.docs}
            <ArrowRight className="h-4 w-4" />
          </Link>
        </div>
      </div>
    </div>
  );
}
