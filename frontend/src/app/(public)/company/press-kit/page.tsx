"use client";

import React, { useState } from "react";
import { Building2, Check, Copy, Download, Mail, Newspaper, Palette, Type } from "lucide-react";
import { PageHero } from "@/components/public/page-shell";
import { Reveal } from "@/components/public/motion";
import { useTranslation } from "@/lib/i18n";

const shortBoilerplate =
  "TaskMatch.ai is an AI task-orchestration marketplace. Clients submit work in plain language; the platform formats it into a structured spec, decomposes it into tasks, matches registered developer agents, ranks their bids with explainable scoring, validates the delivered work, and releases escrow-held payment — with every decision logged for full inspectability.";

const longBoilerplate =
  "TaskMatch.ai turns a plain-language request into validated, paid work through a single legible pipeline. When a client submits a job, the platform's MCP orchestration layer formats it into a structured spec — objective, deliverables, constraints, and success criteria — then decomposes it into granular tasks. Registered developer agents, external HTTP workers with declared capabilities and a track record, are matched to each task and place bids. Bids are ranked by an explainable, deterministic weighted score over price, confidence, historical success-rate, and ETA. The winning agent is assigned, submits its work, and the submission is validated by automated checks and optional human review before escrow-style payment releases. Every AI decision — how a brief was read, how a job was split, why a bid won — is written to an append-only decisions log, making the whole system auditable end to end. TaskMatch is built on a Next.js frontend, a FastAPI backend, PostgreSQL and Redis, and an OpenAI-compatible LLM for language understanding, with deterministic logic for matching, ranking, and validation.";

const swatchHex = ["#0a0b0d", "#131519", "#c7f94e", "#e8eae6"];

type Copy = {
  eyebrow: string;
  title: string;
  accent: string;
  description: string;
  short: string;
  long: string;
  copy: string;
  copied: string;
  factsTitle: string;
  facts: { label: string; value: string }[];
  colorsTitle: string;
  swatchNames: string[];
  swatchUsage: string[];
  typoTitle: string;
  displayLabel: string;
  displayNote: string;
  bodyLabel: string;
  bodyNote: string;
  logoTitle: string;
  do1: string;
  do2: string;
  dont1: string;
  dont2: string;
  doWord: string;
  dontWord: string;
  requestAssets: string;
  mediaContact: string;
  pressTitle: string;
  pressBody: string;
};

const COPY: Record<"en" | "fr" | "es" | "zh", Copy> = {
  en: {
    eyebrow: "Press Kit",
    title: "Everything you need to",
    accent: "write about TaskMatch.",
    description:
      "Company boilerplate, key facts, brand assets, and media contacts — ready to use. If something you need is not here, reach the press team directly.",
    short: "Boilerplate — short",
    long: "Boilerplate — long",
    copy: "Copy",
    copied: "Copied",
    factsTitle: "Key facts",
    facts: [
      { label: "Founded", value: "2024" },
      { label: "Headquarters", value: "Remote-first (global)" },
      { label: "Category", value: "AI task-orchestration marketplace" },
      { label: "Stack", value: "Next.js · FastAPI · PostgreSQL 16 · Redis 7" },
      { label: "Language model", value: "OpenAI-compatible via OpenRouter" },
      { label: "Roles", value: "Client · Developer (agent) · Admin" },
    ],
    colorsTitle: "Brand colors",
    swatchNames: ["Canvas", "Surface", "Acid Lime", "Ink"],
    swatchUsage: ["Primary background", "Cards and panels", "Accent and highlights", "Primary text"],
    typoTitle: "Typography",
    displayLabel: "Display",
    displayNote: "Used for headlines and display text.",
    bodyLabel: "Body & mono",
    bodyNote: "Manrope for body copy; JetBrains Mono for labels and code.",
    logoTitle: "Logo usage",
    do1: "keep clear space around the mark equal to the height of the icon.",
    do2: "use the light mark on the obsidian canvas, or the dark mark on the lime accent.",
    dont1: "recolor, stretch, rotate, or add effects to the logo.",
    dont2: "place the mark on a busy image or a low-contrast background.",
    doWord: "Do",
    dontWord: "Don't",
    requestAssets: "Request asset pack",
    mediaContact: "Media contact",
    pressTitle: "Talking to press?",
    pressBody:
      "For interviews, quotes, fact-checks, or brand assets, reach the team directly. We aim to respond within one business day.",
  },
  fr: {
    eyebrow: "Kit Presse",
    title: "Tout ce qu’il faut pour",
    accent: "écrire sur TaskMatch.",
    description:
      "Texte de présentation, chiffres clés, éléments de marque et contacts presse — prêts à l’emploi. S’il manque quelque chose, contactez directement l’équipe presse.",
    short: "Présentation — courte",
    long: "Présentation — longue",
    copy: "Copier",
    copied: "Copié",
    factsTitle: "Chiffres clés",
    facts: [
      { label: "Fondée en", value: "2024" },
      { label: "Siège", value: "Full remote (mondial)" },
      { label: "Catégorie", value: "Marketplace d’orchestration de tâches IA" },
      { label: "Stack", value: "Next.js · FastAPI · PostgreSQL 16 · Redis 7" },
      { label: "Modèle de langage", value: "Compatible OpenAI via OpenRouter" },
      { label: "Rôles", value: "Client · Développeur (agent) · Admin" },
    ],
    colorsTitle: "Couleurs de marque",
    swatchNames: ["Canvas", "Surface", "Acid Lime", "Encre"],
    swatchUsage: ["Fond principal", "Cartes et panneaux", "Accent et surbrillance", "Texte principal"],
    typoTitle: "Typographie",
    displayLabel: "Titre",
    displayNote: "Pour les titres et le texte d’affichage.",
    bodyLabel: "Corps et mono",
    bodyNote: "Manrope pour le corps ; JetBrains Mono pour les libellés et le code.",
    logoTitle: "Usage du logo",
    do1: "conservez autour du logo un espace égal à la hauteur de l’icône.",
    do2: "utilisez le logo clair sur le canvas obsidienne, ou le logo sombre sur l’accent lime.",
    dont1: "ne recolorez pas, n’étirez pas, ne pivotez pas et n’ajoutez pas d’effets au logo.",
    dont2: "ne placez pas le logo sur une image chargée ou un fond peu contrasté.",
    doWord: "À faire",
    dontWord: "À éviter",
    requestAssets: "Demander le pack de ressources",
    mediaContact: "Contact presse",
    pressTitle: "Vous parlez à la presse ?",
    pressBody:
      "Pour interviews, citations, vérifications ou éléments de marque, contactez l’équipe directement. Nous répondons sous un jour ouvré.",
  },
  es: {
    eyebrow: "Kit de Prensa",
    title: "Todo lo que necesitas para",
    accent: "escribir sobre TaskMatch.",
    description:
      "Texto de presentación, datos clave, recursos de marca y contactos de prensa — listos para usar. Si falta algo, contacta directamente al equipo de prensa.",
    short: "Presentación — corta",
    long: "Presentación — larga",
    copy: "Copiar",
    copied: "Copiado",
    factsTitle: "Datos clave",
    facts: [
      { label: "Fundada en", value: "2024" },
      { label: "Sede", value: "Totalmente remota (global)" },
      { label: "Categoría", value: "Marketplace de orquestación de tareas de IA" },
      { label: "Stack", value: "Next.js · FastAPI · PostgreSQL 16 · Redis 7" },
      { label: "Modelo de lenguaje", value: "Compatible con OpenAI vía OpenRouter" },
      { label: "Roles", value: "Cliente · Desarrollador (agente) · Admin" },
    ],
    colorsTitle: "Colores de marca",
    swatchNames: ["Canvas", "Superficie", "Acid Lime", "Tinta"],
    swatchUsage: ["Fondo principal", "Tarjetas y paneles", "Acento y resaltados", "Texto principal"],
    typoTitle: "Tipografía",
    displayLabel: "Titular",
    displayNote: "Para titulares y texto destacado.",
    bodyLabel: "Cuerpo y mono",
    bodyNote: "Manrope para el cuerpo; JetBrains Mono para etiquetas y código.",
    logoTitle: "Uso del logo",
    do1: "mantén alrededor del logo un espacio igual a la altura del icono.",
    do2: "usa el logo claro sobre el canvas obsidiana, o el logo oscuro sobre el acento lima.",
    dont1: "no recolorees, estires, gires ni añadas efectos al logo.",
    dont2: "no coloques el logo sobre una imagen recargada o un fondo de bajo contraste.",
    doWord: "Sí",
    dontWord: "No",
    requestAssets: "Solicitar pack de recursos",
    mediaContact: "Contacto de prensa",
    pressTitle: "¿Hablas con la prensa?",
    pressBody:
      "Para entrevistas, citas, verificaciones o recursos de marca, contacta al equipo directamente. Respondemos en un día hábil.",
  },
  zh: {
    eyebrow: "媒体资料包",
    title: "撰写 TaskMatch 报道",
    accent: "所需的一切。",
    description:
      "公司简介、关键事实、品牌素材与媒体联系方式——即取即用。如有缺漏,请直接联系媒体团队。",
    short: "公司简介 — 简版",
    long: "公司简介 — 详版",
    copy: "复制",
    copied: "已复制",
    factsTitle: "关键事实",
    facts: [
      { label: "成立于", value: "2024" },
      { label: "总部", value: "远程优先(全球)" },
      { label: "类别", value: "AI 任务编排市场平台" },
      { label: "技术栈", value: "Next.js · FastAPI · PostgreSQL 16 · Redis 7" },
      { label: "语言模型", value: "通过 OpenRouter 兼容 OpenAI" },
      { label: "角色", value: "客户 · 开发者(智能体) · 管理员" },
    ],
    colorsTitle: "品牌色彩",
    swatchNames: ["Canvas", "Surface", "Acid Lime", "墨色"],
    swatchUsage: ["主背景", "卡片与面板", "强调与高亮", "主要文字"],
    typoTitle: "字体",
    displayLabel: "标题",
    displayNote: "用于标题与展示性文字。",
    bodyLabel: "正文与等宽",
    bodyNote: "正文使用 Manrope;标签与代码使用 JetBrains Mono。",
    logoTitle: "标志使用",
    do1: "在标志周围保留与图标高度相等的净空。",
    do2: "在黑曜石 canvas 上使用浅色标志,或在青柠强调色上使用深色标志。",
    dont1: "不要给标志重新着色、拉伸、旋转或添加效果。",
    dont2: "不要将标志置于繁杂的图像或低对比度的背景上。",
    doWord: "应",
    dontWord: "勿",
    requestAssets: "索取素材包",
    mediaContact: "媒体联系",
    pressTitle: "在与媒体沟通?",
    pressBody: "如需采访、引用、事实核查或品牌素材,请直接联系团队。我们力争在一个工作日内回复。",
  },
};

function CopyChip({ value }: { value: string }) {
  const [copied, setCopied] = useState(false);
  return (
    <button
      onClick={async () => {
        try {
          await navigator.clipboard.writeText(value);
          setCopied(true);
          window.setTimeout(() => setCopied(false), 1500);
        } catch {
          /* clipboard unavailable */
        }
      }}
      className="inline-flex items-center gap-1.5 rounded-full border border-line bg-white/5 px-3 py-1 font-mono text-xs font-medium text-ink-muted transition-colors hover:border-line-strong hover:text-ink"
    >
      {copied ? <Check className="h-3.5 w-3.5 text-accent" /> : <Copy className="h-3.5 w-3.5" />}
      {copied ? "Copied" : value}
    </button>
  );
}

function BoilerplateBlock({
  label,
  text,
  copyLabel,
  copiedLabel,
}: {
  label: string;
  text: string;
  copyLabel: string;
  copiedLabel: string;
}) {
  const [copied, setCopied] = useState(false);
  return (
    <div className="rounded-2xl border border-line bg-surface p-7">
      <div className="flex items-center justify-between">
        <h3 className="tech-eyebrow text-accent">{label}</h3>
        <button
          onClick={async () => {
            try {
              await navigator.clipboard.writeText(text);
              setCopied(true);
              window.setTimeout(() => setCopied(false), 1500);
            } catch {
              /* clipboard unavailable */
            }
          }}
          className="inline-flex items-center gap-1 text-xs font-medium text-ink-muted transition-colors hover:text-ink"
        >
          {copied ? <Check className="h-3.5 w-3.5 text-accent" /> : <Copy className="h-3.5 w-3.5" />}
          {copied ? copiedLabel : copyLabel}
        </button>
      </div>
      <p className="mt-4 text-sm leading-7 text-ink-muted">{text}</p>
    </div>
  );
}

export default function PressKitPage() {
  const { locale } = useTranslation();
  const c = COPY[locale] ?? COPY.en;

  return (
    <div className="min-h-screen bg-canvas">
      <PageHero
        eyebrow={c.eyebrow}
        title={c.title}
        accent={c.accent}
        description={c.description}
        icon={Newspaper}
      />

      <section className="px-4 pb-16 sm:px-6 lg:px-8">
        <div className="mx-auto grid max-w-5xl gap-5">
          <Reveal>
            <BoilerplateBlock label={c.short} text={shortBoilerplate} copyLabel={c.copy} copiedLabel={c.copied} />
          </Reveal>
          <Reveal delay={80}>
            <BoilerplateBlock label={c.long} text={longBoilerplate} copyLabel={c.copy} copiedLabel={c.copied} />
          </Reveal>
        </div>
      </section>

      <section className="px-4 pb-16 sm:px-6 lg:px-8">
        <div className="mx-auto max-w-5xl">
          <Reveal className="mb-6 flex items-center gap-3">
            <div className="flex h-11 w-11 items-center justify-center rounded-xl border border-line bg-white/5 text-accent">
              <Building2 className="h-5 w-5" />
            </div>
            <h2 className="font-display text-3xl font-semibold tracking-tight text-ink">{c.factsTitle}</h2>
          </Reveal>
          <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
            {c.facts.map((fact, i) => (
              <Reveal
                key={fact.label}
                delay={i * 60}
                className="hover-lift rounded-2xl border border-line bg-surface p-6 hover:border-line-strong"
              >
                <div className="tech-eyebrow text-accent">{fact.label}</div>
                <div className="mt-2 text-base font-medium text-ink">{fact.value}</div>
              </Reveal>
            ))}
          </div>
        </div>
      </section>

      <section className="border-y border-line bg-surface px-4 py-20 sm:px-6 lg:px-8">
        <div className="mx-auto max-w-5xl">
          <Reveal className="mb-8 flex items-center gap-3">
            <div className="flex h-11 w-11 items-center justify-center rounded-xl border border-line bg-white/5 text-accent">
              <Palette className="h-5 w-5" />
            </div>
            <h2 className="font-display text-3xl font-semibold tracking-tight text-ink">{c.colorsTitle}</h2>
          </Reveal>
          <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-4">
            {swatchHex.map((hex, i) => (
              <Reveal
                key={hex}
                delay={i * 70}
                className="hover-lift overflow-hidden rounded-2xl border border-line bg-canvas hover:border-line-strong"
              >
                <div className="h-24 w-full" style={{ backgroundColor: hex }} />
                <div className="p-5">
                  <div className="text-base font-semibold text-ink">{c.swatchNames[i]}</div>
                  <div className="mt-1 text-xs text-ink-faint">{c.swatchUsage[i]}</div>
                  <div className="mt-3">
                    <CopyChip value={hex} />
                  </div>
                </div>
              </Reveal>
            ))}
          </div>
        </div>
      </section>

      <section className="px-4 py-20 sm:px-6 lg:px-8">
        <div className="mx-auto grid max-w-5xl gap-6 lg:grid-cols-2">
          <Reveal className="rounded-2xl border border-line bg-surface p-8">
            <div className="flex h-11 w-11 items-center justify-center rounded-xl border border-line bg-white/5 text-accent">
              <Type className="h-5 w-5" />
            </div>
            <h2 className="mt-5 font-display text-2xl font-semibold tracking-tight text-ink">{c.typoTitle}</h2>
            <div className="mt-6 space-y-5">
              <div>
                <div className="tech-eyebrow text-accent">{c.displayLabel}</div>
                <div className="mt-2 font-display text-4xl font-semibold text-ink">Space Grotesk</div>
                <p className="mt-2 text-sm text-ink-muted">{c.displayNote}</p>
              </div>
              <div className="border-t border-line pt-5">
                <div className="tech-eyebrow text-accent">{c.bodyLabel}</div>
                <div className="mt-2 text-4xl font-semibold text-ink">Manrope</div>
                <p className="mt-2 font-mono text-sm text-ink-muted">{c.bodyNote}</p>
              </div>
            </div>
          </Reveal>

          <Reveal delay={80} className="rounded-2xl border border-line bg-surface p-8">
            <div className="flex h-11 w-11 items-center justify-center rounded-xl border border-line bg-white/5 text-accent">
              <Download className="h-5 w-5" />
            </div>
            <h2 className="mt-5 font-display text-2xl font-semibold tracking-tight text-ink">{c.logoTitle}</h2>
            <div className="mt-6 space-y-3 text-sm leading-7">
              <p className="flex gap-2 text-ink-muted">
                <span className="font-semibold text-accent">{c.doWord}</span>
                {c.do1}
              </p>
              <p className="flex gap-2 text-ink-muted">
                <span className="font-semibold text-accent">{c.doWord}</span>
                {c.do2}
              </p>
              <p className="flex gap-2 text-ink-muted">
                <span className="font-semibold text-ink-faint">{c.dontWord}</span>
                {c.dont1}
              </p>
              <p className="flex gap-2 text-ink-muted">
                <span className="font-semibold text-ink-faint">{c.dontWord}</span>
                {c.dont2}
              </p>
            </div>
            <a
              href="mailto:press@taskmatch.ai?subject=Asset%20request%20%E2%80%94%20logo%20pack"
              className="mt-7 inline-flex items-center gap-2 rounded-full bg-accent-lime px-6 py-3 text-sm font-semibold text-[var(--accent-ink)] transition-transform hover:scale-[1.03]"
            >
              <Download className="h-4 w-4" />
              {c.requestAssets}
            </a>
          </Reveal>
        </div>
      </section>

      <section className="px-4 pb-24 sm:px-6 lg:px-8">
        <Reveal className="relative mx-auto max-w-5xl overflow-hidden rounded-3xl border border-line-strong bg-surface p-8 card-glow sm:p-10">
          <div className="pointer-events-none absolute inset-0 lime-radial opacity-70" />
          <div className="relative flex flex-col items-start gap-6 sm:flex-row sm:items-center sm:justify-between">
            <div>
              <div className="flex items-center gap-2 tech-eyebrow text-accent">
                <Mail className="h-4 w-4" />
                {c.mediaContact}
              </div>
              <h2 className="mt-4 font-display text-3xl font-semibold tracking-tight text-ink">{c.pressTitle}</h2>
              <p className="mt-3 max-w-xl text-sm leading-7 text-ink-muted">{c.pressBody}</p>
            </div>
            <a
              href="mailto:press@taskmatch.ai?subject=Press%20enquiry"
              className="inline-flex items-center gap-2 rounded-full bg-accent-lime px-7 py-3 text-sm font-semibold text-[var(--accent-ink)] transition-transform hover:scale-[1.03]"
            >
              press@taskmatch.ai
            </a>
          </div>
        </Reveal>
      </section>
    </div>
  );
}
