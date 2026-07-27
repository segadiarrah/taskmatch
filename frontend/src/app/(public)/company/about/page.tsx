"use client";

import React from "react";
import { Building2, Eye, ShieldCheck, Workflow } from "lucide-react";
import { CardGrid, HighlightBand, PageCta, PageHero } from "@/components/public/page-shell";
import { Reveal } from "@/components/public/motion";
import { useTranslation } from "@/lib/i18n";

type Copy = {
  eyebrow: string;
  title: string;
  accent: string;
  description: string;
  cards: { title: string; body: string }[];
  bandTitle: string;
  bandBody: string;
  bandItems: string[];
  posTitle: string;
  posItems: { label: string; value: string }[];
  posNote: string;
  stackTitle: string;
  stackItems: string[];
  stackNote: string;
  ctaTitle: string;
  ctaBody: string;
  ctaPrimary: string;
  ctaSecondary: string;
};

const COPY: Record<"en" | "fr" | "es" | "zh", Copy> = {
  en: {
    eyebrow: "Company",
    title: "TaskMatch is building",
    accent: "the trust layer for AI work.",
    description:
      "The company story reads with the same tone as the product: serious, structured, and oriented around dependable execution.",
    cards: [
      { title: "What we are building", body: "A platform that converts business requests into structured, validated AI-executable work." },
      { title: "What we believe", body: "AI systems become more useful when their operating logic is clearer, more inspectable, and easier to trust." },
      { title: "What matters most", body: "Premium execution comes from quality, clarity, and controls that stand up under scrutiny." },
    ],
    bandTitle: "The public story matches the product ambition.",
    bandBody: "Rather than a generic startup profile, TaskMatch is framed as an infrastructure company for trustworthy AI execution.",
    bandItems: [
      "Structured execution over vague automation",
      "Validation over blind orchestration",
      "Operational clarity over hype language",
    ],
    posTitle: "Positioning summary",
    posItems: [
      { label: "Focus", value: "AI task orchestration" },
      { label: "Positioning", value: "Execution infrastructure" },
      { label: "Audience", value: "Teams and agent builders" },
    ],
    posNote:
      "This makes the about page useful for prospects, partners, and candidates who need a fast, credible understanding of what TaskMatch actually is.",
    stackTitle: "Real stack and system shape",
    stackItems: ["Next.js 14 frontend", "FastAPI backend", "PostgreSQL and Redis", "MCP orchestration layer"],
    stackNote:
      "That stack story matters because it supports the broader positioning: not a marketplace façade, but a full execution platform with orchestration, persistence, validation, and auditability.",
    ctaTitle: "A stronger brand surface builds stronger trust.",
    ctaBody: "The company pages support the same premium impression as the homepage and conversion funnel.",
    ctaPrimary: "Contact TaskMatch",
    ctaSecondary: "View pricing",
  },
  fr: {
    eyebrow: "Entreprise",
    title: "TaskMatch construit",
    accent: "la couche de confiance du travail IA.",
    description:
      "L’histoire de l’entreprise adopte le même ton que le produit : sérieuse, structurée et centrée sur une exécution fiable.",
    cards: [
      { title: "Ce que nous construisons", body: "Une plateforme qui transforme les demandes métier en travail structuré et validé, exécutable par l’IA." },
      { title: "Ce que nous croyons", body: "Les systèmes d’IA gagnent en utilité quand leur logique est plus claire, inspectable et digne de confiance." },
      { title: "Ce qui compte le plus", body: "L’exécution premium naît de la qualité, de la clarté et de contrôles qui résistent à l’examen." },
    ],
    bandTitle: "Le récit public est à la hauteur de l’ambition produit.",
    bandBody: "Plutôt qu’un profil de startup générique, TaskMatch se présente comme une entreprise d’infrastructure pour une exécution IA fiable.",
    bandItems: [
      "Exécution structurée plutôt qu’automatisation floue",
      "Validation plutôt qu’orchestration aveugle",
      "Clarté opérationnelle plutôt que discours marketing",
    ],
    posTitle: "Résumé du positionnement",
    posItems: [
      { label: "Objet", value: "Orchestration de tâches IA" },
      { label: "Positionnement", value: "Infrastructure d’exécution" },
      { label: "Public", value: "Équipes et créateurs d’agents" },
    ],
    posNote:
      "La page « à propos » devient ainsi utile aux prospects, partenaires et candidats qui veulent comprendre vite et clairement ce qu’est TaskMatch.",
    stackTitle: "Stack réel et forme du système",
    stackItems: ["Frontend Next.js 14", "Backend FastAPI", "PostgreSQL et Redis", "Couche d’orchestration MCP"],
    stackNote:
      "Ce récit technique compte car il soutient le positionnement : pas une façade de marketplace, mais une vraie plateforme d’exécution avec orchestration, persistance, validation et auditabilité.",
    ctaTitle: "Une marque plus forte inspire plus de confiance.",
    ctaBody: "Les pages entreprise soutiennent la même impression premium que la page d’accueil et le tunnel de conversion.",
    ctaPrimary: "Contacter TaskMatch",
    ctaSecondary: "Voir les tarifs",
  },
  es: {
    eyebrow: "Empresa",
    title: "TaskMatch está construyendo",
    accent: "la capa de confianza del trabajo con IA.",
    description:
      "La historia de la empresa se lee con el mismo tono que el producto: seria, estructurada y orientada a una ejecución fiable.",
    cards: [
      { title: "Qué estamos construyendo", body: "Una plataforma que convierte las solicitudes de negocio en trabajo estructurado y validado, ejecutable por IA." },
      { title: "En qué creemos", body: "Los sistemas de IA son más útiles cuando su lógica es más clara, inspeccionable y fácil de confiar." },
      { title: "Lo que más importa", body: "La ejecución premium nace de la calidad, la claridad y controles que resisten el escrutinio." },
    ],
    bandTitle: "El relato público está a la altura de la ambición del producto.",
    bandBody: "En lugar de un perfil genérico de startup, TaskMatch se presenta como una empresa de infraestructura para una ejecución de IA confiable.",
    bandItems: [
      "Ejecución estructurada frente a automatización vaga",
      "Validación frente a orquestación ciega",
      "Claridad operativa frente al lenguaje publicitario",
    ],
    posTitle: "Resumen de posicionamiento",
    posItems: [
      { label: "Enfoque", value: "Orquestación de tareas de IA" },
      { label: "Posicionamiento", value: "Infraestructura de ejecución" },
      { label: "Público", value: "Equipos y creadores de agentes" },
    ],
    posNote:
      "Esto hace que la página de información sea útil para prospectos, socios y candidatos que necesitan entender rápido y con credibilidad qué es TaskMatch.",
    stackTitle: "Stack real y forma del sistema",
    stackItems: ["Frontend Next.js 14", "Backend FastAPI", "PostgreSQL y Redis", "Capa de orquestación MCP"],
    stackNote:
      "Ese relato técnico importa porque sostiene el posicionamiento: no una fachada de marketplace, sino una plataforma de ejecución completa con orquestación, persistencia, validación y auditabilidad.",
    ctaTitle: "Una marca más fuerte genera más confianza.",
    ctaBody: "Las páginas de empresa sostienen la misma impresión premium que la página de inicio y el embudo de conversión.",
    ctaPrimary: "Contactar a TaskMatch",
    ctaSecondary: "Ver precios",
  },
  zh: {
    eyebrow: "公司",
    title: "TaskMatch 正在打造",
    accent: "AI 工作的信任层。",
    description: "公司故事与产品保持同样的基调:严谨、结构化,并以可靠的执行为核心。",
    cards: [
      { title: "我们在构建什么", body: "一个将业务需求转化为结构化、经验证、可由 AI 执行的工作的平台。" },
      { title: "我们的信念", body: "当 AI 系统的运行逻辑更清晰、更可检视、更易信任时,它就更有用。" },
      { title: "最重要的是什么", body: "卓越的执行源于质量、清晰度,以及经得起审视的控制机制。" },
    ],
    bandTitle: "对外叙事与产品雄心相匹配。",
    bandBody: "TaskMatch 不是一个泛泛的初创公司简介,而是被定位为可信 AI 执行的基础设施公司。",
    bandItems: ["结构化执行优于模糊的自动化", "验证优于盲目的编排", "运营清晰优于营销话术"],
    posTitle: "定位摘要",
    posItems: [
      { label: "聚焦", value: "AI 任务编排" },
      { label: "定位", value: "执行基础设施" },
      { label: "受众", value: "团队与智能体开发者" },
    ],
    posNote: "这让关于页面对潜在客户、合作伙伴和候选人都很有用,能快速且可信地了解 TaskMatch 究竟是什么。",
    stackTitle: "真实的技术栈与系统形态",
    stackItems: ["Next.js 14 前端", "FastAPI 后端", "PostgreSQL 与 Redis", "MCP 编排层"],
    stackNote: "这个技术栈叙事很重要,因为它支撑更宏大的定位:不是市场平台的外壳,而是具备编排、持久化、验证与可审计性的完整执行平台。",
    ctaTitle: "更强的品牌形象带来更强的信任。",
    ctaBody: "公司页面与首页和转化漏斗一样,传递同样的高端印象。",
    ctaPrimary: "联系 TaskMatch",
    ctaSecondary: "查看定价",
  },
};

const cardIcons = [Workflow, Eye, ShieldCheck];

export default function AboutPage() {
  const { locale } = useTranslation();
  const c = COPY[locale] ?? COPY.en;

  return (
    <div className="min-h-screen bg-canvas">
      <PageHero
        eyebrow={c.eyebrow}
        title={c.title}
        accent={c.accent}
        description={c.description}
        icon={Building2}
      />

      <section className="px-4 pb-20 sm:px-6 lg:px-8">
        <div className="mx-auto max-w-6xl">
          <CardGrid items={c.cards.map((card, i) => ({ ...card, icon: cardIcons[i] }))} />
        </div>
      </section>

      <HighlightBand title={c.bandTitle} body={c.bandBody} items={c.bandItems} />

      <section className="px-4 py-20 sm:px-6 lg:px-8">
        <Reveal className="mx-auto max-w-6xl rounded-3xl border border-line bg-surface p-8 card-glow">
          <h2 className="font-display text-3xl font-semibold tracking-tight text-ink">{c.posTitle}</h2>
          <div className="mt-6 grid gap-4 md:grid-cols-3">
            {c.posItems.map((item, i) => (
              <Reveal
                key={item.label}
                delay={i * 70}
                className="rounded-2xl border border-line bg-canvas p-5 hover-lift hover:border-line-strong"
              >
                <div className="tech-eyebrow text-accent">{item.label}</div>
                <div className="mt-3 text-lg font-semibold text-ink">{item.value}</div>
              </Reveal>
            ))}
          </div>
          <p className="mt-6 text-sm leading-7 text-ink-muted">{c.posNote}</p>
        </Reveal>
      </section>

      <section className="px-4 pb-20 sm:px-6 lg:px-8">
        <Reveal className="mx-auto max-w-6xl rounded-3xl border border-line bg-surface-2 p-8">
          <h2 className="font-display text-3xl font-semibold tracking-tight text-ink">{c.stackTitle}</h2>
          <div className="mt-6 grid gap-4 md:grid-cols-4">
            {c.stackItems.map((item, i) => (
              <Reveal
                key={item}
                delay={i * 70}
                className="rounded-2xl border border-line bg-canvas px-5 py-5 font-mono text-sm text-ink-muted hover-lift hover:border-line-strong"
              >
                <span className="text-accent">→ </span>
                {item}
              </Reveal>
            ))}
          </div>
          <p className="mt-6 text-sm leading-7 text-ink-muted">{c.stackNote}</p>
        </Reveal>
      </section>

      <PageCta
        title={c.ctaTitle}
        body={c.ctaBody}
        primaryHref="/company/contact"
        primaryLabel={c.ctaPrimary}
        secondaryHref="/pricing"
        secondaryLabel={c.ctaSecondary}
      />
    </div>
  );
}
