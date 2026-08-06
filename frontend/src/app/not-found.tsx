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
    <div className="flex min-h-screen items-center justify-center bg-white px-4">
      <div className="w-full max-w-lg rounded-2xl border border-stone-200 bg-white p-10 text-center shadow-sm">
        <div className="eyebrow text-brand-700">{c.eyebrow}</div>
        <div className="mt-4 text-8xl font-semibold leading-none text-stone-900">404</div>
        <h1 className="mt-6 text-3xl font-semibold tracking-tight text-stone-900">{c.title}</h1>
        <p className="mx-auto mt-4 max-w-sm text-sm leading-7 text-stone-600">{c.body}</p>
        <div className="mt-8 flex flex-col items-center justify-center gap-3 sm:flex-row">
          <Link
            href="/"
            className="inline-flex h-12 items-center justify-center gap-2 rounded-lg bg-brand-800 px-7 text-sm font-semibold text-white transition-colors hover:bg-brand-900"
          >
            <Home className="h-4 w-4" />
            {c.home}
          </Link>
          <Link
            href="/resources/documentation"
            className="inline-flex h-12 items-center justify-center gap-2 rounded-lg border border-stone-300 px-7 text-sm font-medium text-stone-700 transition-colors hover:bg-stone-50"
          >
            {c.docs}
            <ArrowRight className="h-4 w-4" />
          </Link>
        </div>
      </div>
    </div>
  );
}
