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
    <div className="surface-dark relative flex min-h-screen items-center justify-center overflow-hidden bg-canvas px-4">
      <div className="pointer-events-none absolute inset-0 lime-radial" />
      <div className="pointer-events-none absolute inset-x-0 top-0 h-[520px] grid-bg" />
      <div className="relative w-full max-w-lg overflow-hidden rounded-3xl border border-line-strong bg-surface p-10 text-center card-glow">
        <div className="tech-eyebrow text-accent">{c.eyebrow}</div>
        <div className="mt-4 font-display text-8xl font-semibold leading-none text-gradient-lime">404</div>
        <h1 className="mt-6 font-display text-3xl font-semibold tracking-tight text-ink">{c.title}</h1>
        <p className="mx-auto mt-4 max-w-sm text-sm leading-7 text-ink-muted">{c.body}</p>
        <div className="mt-8 flex flex-col items-center justify-center gap-3 sm:flex-row">
          <Link
            href="/"
            className="group inline-flex h-12 items-center justify-center gap-2 rounded-full bg-accent-lime px-7 text-sm font-semibold text-[var(--accent-ink)] transition-transform hover:scale-[1.03]"
          >
            <Home className="h-4 w-4" />
            {c.home}
          </Link>
          <Link
            href="/resources/documentation"
            className="group inline-flex h-12 items-center justify-center gap-2 rounded-full border border-line-strong px-7 text-sm font-medium text-ink transition-colors hover:bg-white/5"
          >
            {c.docs}
            <ArrowRight className="h-4 w-4 transition-transform group-hover:translate-x-0.5" />
          </Link>
        </div>
      </div>
    </div>
  );
}
