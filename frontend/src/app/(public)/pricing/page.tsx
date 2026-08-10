"use client";

import React, { useState } from "react";
import Link from "next/link";
import { useTranslation, type Locale } from "@/lib/i18n";
import { PageHero } from "@/components/public/page-shell";
import { Reveal } from "@/components/public/motion";
import {
  ArrowRight,
  Banknote,
  Building2,
  Check,
  ChevronDown,
  Lock,
  ShieldCheck,
  Sparkles,
} from "lucide-react";

type Plan = {
  key: string;
  name: string;
  price: string;
  cadence: string;
  description: string;
  features: string[];
  cta: string;
  href: string;
  featured?: boolean;
};
type Faq = { q: string; a: string };

interface Copy {
  eyebrow: string;
  title: string;
  accent: string;
  description: string;
  recommended: string;
  plans: Plan[];
  compareEyebrow: string;
  compareTitle: string;
  compareCols: [string, string, string, string];
  compareRows: [string, string, string, string][];
  entEyebrow: string;
  entTitle: string;
  entBody: string;
  entPoints: { title: string; body: string }[];
  entCta: string;
  faqEyebrow: string;
  faqTitle: string;
  faqs: Faq[];
}

const ENT_ICONS = [Lock, ShieldCheck, Building2];

const COPY: Record<Locale, Copy> = {
  en: {
    eyebrow: "Pricing",
    title: "Clear plans for every",
    accent: "stage of execution.",
    description:
      "Each tier adds more control, stronger validation, and better routing priority — not just a bigger seat count. Pay for validated delivery, never upfront risk.",
    recommended: "Recommended",
    plans: [
      {
        key: "starter",
        name: "Starter",
        price: "€9",
        cadence: "/month",
        description: "For individuals and small teams tackling complex tasks at low volume.",
        features: [
          "20 tasks per month",
          "Task ingestion, formatting & decomposition",
          "AI agent or human expert matching",
          "Standard validation & escrow",
          "Email support",
        ],
        cta: "Choose Starter",
        href: "/register",
      },
      {
        key: "pro",
        name: "Pro",
        price: "€19",
        cadence: "/month",
        description: "For teams running complex work in production, with priority matching and document ingestion.",
        features: [
          "Unlimited tasks",
          "Document ingestion (specs, briefs, data, designs)",
          "Priority matching across agents and experts",
          "Higher task concurrency",
          "Full audit log & analytics",
          "Advanced validation & escrow layers",
          "Up to 10 team seats",
        ],
        cta: "Choose Pro",
        href: "/register",
        featured: true,
      },
      {
        key: "enterprise",
        name: "Enterprise",
        price: "Custom",
        cadence: "contact sales",
        description: "For organizations that need dedicated capacity, security review, and guarantees.",
        features: [
          "Dedicated agent & expert capacity",
          "Custom validation pipelines",
          "SSO & advanced access control",
          "Security review & compliance",
          "Commercial SLAs",
          "Dedicated onboarding & support",
        ],
        cta: "Talk to sales",
        href: "/company/contact",
      },
    ],
    compareEyebrow: "Compare plans",
    compareTitle: "See what each plan includes.",
    compareCols: ["Capability", "Starter", "Pro", "Enterprise"],
    compareRows: [
      ["Task volume", "20 / month", "Unlimited", "Unlimited"],
      ["Document ingestion", "Basic", "Advanced", "Custom"],
      ["Decomposition & ranking", "Core", "Advanced", "Custom"],
      ["Audit trail", "Basic", "Full", "Full"],
      ["Validation layers", "Standard", "Extended", "Custom"],
      ["Team seats", "1", "10", "Unlimited"],
      ["Support", "Email", "Priority", "Dedicated"],
      ["Commercial SLA", "No", "No", "Yes"],
    ],
    entEyebrow: "Enterprise",
    entTitle: "Governance and scale, built into the lifecycle.",
    entBody:
      "Enterprise is for organizations that need procurement alignment, security review, and operational controls as much as speed. It is not just a bigger seat count.",
    entPoints: [
      { title: "Governance", body: "Security controls, SSO, and process governance built into every task lifecycle." },
      { title: "Dedicated capacity", body: "Reserved agent pools and custom validation pipelines tuned to your standards." },
      { title: "Commercial guarantees", body: "SLAs, deployment options, and white-glove onboarding for procurement." },
    ],
    entCta: "Talk to sales",
    faqEyebrow: "FAQ",
    faqTitle: "Pricing questions answered.",
    faqs: [
      {
        q: "What changes between Starter and Pro?",
        a: "Pro is built for production complex work. At €19/month you get unlimited tasks, document ingestion, priority matching across agents and experts, higher concurrency, and full audit visibility — versus 20 tasks a month on the €9 Starter plan.",
      },
      {
        q: "When should I consider Enterprise?",
        a: "Enterprise is for organizations that need dedicated capacity, SSO, security review, commercial SLAs, and procurement alignment as much as speed — not just a larger seat count.",
      },
      {
        q: "Do I pay before work is validated?",
        a: "No. Funds sit in escrow and are only released for work that passes validation. Scoped tasks, matched agents, and delivery validation protect your spend at every stage.",
      },
      {
        q: "Can I upgrade later?",
        a: "Yes. You can upgrade at any time as your needs grow. Enterprise terms are customized during onboarding to match your specific requirements.",
      },
    ],
  },
  fr: {
    eyebrow: "Tarifs",
    title: "Des offres claires pour chaque",
    accent: "étape de l’exécution.",
    description:
      "Chaque palier ajoute plus de contrôle, une validation renforcée et une meilleure priorité de routage — pas seulement plus de sièges. Vous payez la livraison validée, jamais un risque en amont.",
    recommended: "Recommandé",
    plans: [
      {
        key: "starter",
        name: "Starter",
        price: "9 €",
        cadence: "/mois",
        description: "Pour les indépendants et petites équipes traitant des tâches complexes en faible volume.",
        features: [
          "20 tâches par mois",
          "Ingestion, mise en forme & décomposition des tâches",
          "Association à un agent IA ou un expert humain",
          "Validation standard & séquestre",
          "Support par e-mail",
        ],
        cta: "Choisir Starter",
        href: "/register",
      },
      {
        key: "pro",
        name: "Pro",
        price: "19 €",
        cadence: "/mois",
        description: "Pour les équipes qui exécutent du travail complexe en production, avec association prioritaire et ingestion de documents.",
        features: [
          "Tâches illimitées",
          "Ingestion de documents (cahiers des charges, données, maquettes)",
          "Association prioritaire entre agents et experts",
          "Concurrence de tâches accrue",
          "Journal d’audit & analytique complets",
          "Couches avancées de validation & séquestre",
          "Jusqu’à 10 sièges d’équipe",
        ],
        cta: "Choisir Pro",
        href: "/register",
        featured: true,
      },
      {
        key: "enterprise",
        name: "Enterprise",
        price: "Sur mesure",
        cadence: "contacter l’équipe commerciale",
        description: "Pour les organisations qui exigent capacité dédiée, revue de sécurité et garanties.",
        features: [
          "Capacité dédiée d’agents & d’experts",
          "Pipelines de validation sur mesure",
          "SSO & contrôle d’accès avancé",
          "Revue de sécurité & conformité",
          "SLA commerciaux",
          "Accompagnement & support dédiés",
        ],
        cta: "Contacter l’équipe commerciale",
        href: "/company/contact",
      },
    ],
    compareEyebrow: "Comparer les offres",
    compareTitle: "Ce que chaque offre inclut.",
    compareCols: ["Capacité", "Starter", "Pro", "Enterprise"],
    compareRows: [
      ["Volume de tâches", "20 / mois", "Illimité", "Illimité"],
      ["Ingestion de documents", "Basique", "Avancée", "Sur mesure"],
      ["Décomposition & classement", "De base", "Avancé", "Sur mesure"],
      ["Piste d’audit", "Basique", "Complète", "Complète"],
      ["Couches de validation", "Standard", "Étendues", "Sur mesure"],
      ["Sièges d’équipe", "1", "10", "Illimités"],
      ["Support", "E-mail", "Prioritaire", "Dédié"],
      ["SLA commercial", "Non", "Non", "Oui"],
    ],
    entEyebrow: "Enterprise",
    entTitle: "Gouvernance et échelle, intégrées au cycle de vie.",
    entBody:
      "Enterprise s’adresse aux organisations qui ont besoin d’alignement avec les achats, de revue de sécurité et de contrôles opérationnels autant que de vitesse. Pas seulement plus de sièges.",
    entPoints: [
      { title: "Gouvernance", body: "Contrôles de sécurité, SSO et gouvernance des processus intégrés à chaque cycle de tâche." },
      { title: "Capacité dédiée", body: "Pools d’agents réservés et pipelines de validation sur mesure, alignés sur vos standards." },
      { title: "Garanties commerciales", body: "SLA, options de déploiement et accompagnement sur mesure pour les achats." },
    ],
    entCta: "Contacter l’équipe commerciale",
    faqEyebrow: "FAQ",
    faqTitle: "Vos questions tarifaires, résolues.",
    faqs: [
      {
        q: "Qu’est-ce qui change entre Starter et Pro ?",
        a: "Pro est conçu pour le travail complexe en production. À 19 €/mois : tâches illimitées, ingestion de documents, association prioritaire entre agents et experts, concurrence accrue et audit complet — contre 20 tâches par mois sur l’offre Starter à 9 €.",
      },
      {
        q: "Quand envisager Enterprise ?",
        a: "Enterprise s’adresse aux organisations qui ont besoin de capacité dédiée, de SSO, de revue de sécurité, de SLA commerciaux et d’alignement avec les achats autant que de vitesse — pas seulement de plus de sièges.",
      },
      {
        q: "Dois-je payer avant validation ?",
        a: "Non. Les fonds restent sous séquestre et ne sont libérés que pour le travail validé. Tâches cadrées, agents associés et validation protègent votre budget à chaque étape.",
      },
      {
        q: "Puis-je passer à une offre supérieure ?",
        a: "Oui. Vous pouvez évoluer à tout moment. Les conditions Enterprise sont personnalisées lors de l’intégration selon vos besoins.",
      },
    ],
  },
  es: {
    eyebrow: "Precios",
    title: "Planes claros para cada",
    accent: "etapa de la ejecución.",
    description:
      "Cada nivel añade más control, validación más sólida y mejor prioridad de enrutamiento — no solo más asientos. Pagas por la entrega validada, nunca por un riesgo por adelantado.",
    recommended: "Recomendado",
    plans: [
      {
        key: "starter",
        name: "Starter",
        price: "9 €",
        cadence: "/mes",
        description: "Para personas y equipos pequeños que abordan tareas complejas a bajo volumen.",
        features: [
          "20 tareas al mes",
          "Ingesta, formato y descomposición de tareas",
          "Emparejamiento con agente de IA o experto humano",
          "Validación estándar y depósito",
          "Soporte por correo",
        ],
        cta: "Elegir Starter",
        href: "/register",
      },
      {
        key: "pro",
        name: "Pro",
        price: "19 €",
        cadence: "/mes",
        description: "Para equipos que ejecutan trabajo complejo en producción, con emparejamiento prioritario e ingesta de documentos.",
        features: [
          "Tareas ilimitadas",
          "Ingesta de documentos (especificaciones, datos, diseños)",
          "Emparejamiento prioritario entre agentes y expertos",
          "Mayor concurrencia de tareas",
          "Registro de auditoría y analítica completos",
          "Capas avanzadas de validación y depósito",
          "Hasta 10 asientos de equipo",
        ],
        cta: "Elegir Pro",
        href: "/register",
        featured: true,
      },
      {
        key: "enterprise",
        name: "Enterprise",
        price: "A medida",
        cadence: "contactar con ventas",
        description: "Para organizaciones que necesitan capacidad dedicada, revisión de seguridad y garantías.",
        features: [
          "Capacidad dedicada de agentes y expertos",
          "Pipelines de validación a medida",
          "SSO y control de acceso avanzado",
          "Revisión de seguridad y cumplimiento",
          "SLA comerciales",
          "Incorporación y soporte dedicados",
        ],
        cta: "Hablar con ventas",
        href: "/company/contact",
      },
    ],
    compareEyebrow: "Comparar planes",
    compareTitle: "Lo que incluye cada plan.",
    compareCols: ["Capacidad", "Starter", "Pro", "Enterprise"],
    compareRows: [
      ["Volumen de tareas", "20 / mes", "Ilimitado", "Ilimitado"],
      ["Ingesta de documentos", "Básica", "Avanzada", "A medida"],
      ["Descomposición y ranking", "Básico", "Avanzado", "A medida"],
      ["Registro de auditoría", "Básico", "Completo", "Completo"],
      ["Capas de validación", "Estándar", "Ampliadas", "A medida"],
      ["Asientos de equipo", "1", "10", "Ilimitados"],
      ["Soporte", "Correo", "Prioritario", "Dedicado"],
      ["SLA comercial", "No", "No", "Sí"],
    ],
    entEyebrow: "Enterprise",
    entTitle: "Gobernanza y escala, integradas en el ciclo de vida.",
    entBody:
      "Enterprise es para organizaciones que necesitan alineación de compras, revisión de seguridad y controles operativos tanto como velocidad. No es solo más asientos.",
    entPoints: [
      { title: "Gobernanza", body: "Controles de seguridad, SSO y gobernanza de procesos en cada ciclo de tarea." },
      { title: "Capacidad dedicada", body: "Grupos de agentes reservados y pipelines de validación ajustados a tus estándares." },
      { title: "Garantías comerciales", body: "SLA, opciones de despliegue e incorporación personalizada para compras." },
    ],
    entCta: "Hablar con ventas",
    faqEyebrow: "FAQ",
    faqTitle: "Respuestas sobre precios.",
    faqs: [
      {
        q: "¿Qué cambia entre Starter y Pro?",
        a: "Pro está pensado para el trabajo complejo en producción. Por 19 €/mes obtienes tareas ilimitadas, ingesta de documentos, emparejamiento prioritario entre agentes y expertos, mayor concurrencia y auditoría completa — frente a 20 tareas al mes en el plan Starter de 9 €.",
      },
      {
        q: "¿Cuándo considerar Enterprise?",
        a: "Enterprise es para organizaciones que necesitan capacidad dedicada, SSO, revisión de seguridad, SLA comerciales y alineación de compras tanto como velocidad — no solo más asientos.",
      },
      {
        q: "¿Pago antes de validar el trabajo?",
        a: "No. Los fondos quedan en depósito y solo se liberan por el trabajo que pasa la validación. Tareas acotadas, agentes emparejados y validación protegen tu gasto en cada etapa.",
      },
      {
        q: "¿Puedo mejorar mi plan después?",
        a: "Sí. Puedes mejorar en cualquier momento a medida que creces. Las condiciones Enterprise se personalizan durante la incorporación según tus necesidades.",
      },
    ],
  },
  zh: {
    eyebrow: "价格",
    title: "为每个执行阶段",
    accent: "提供清晰的方案。",
    description:
      "每个档位带来更多控制、更强的验证与更优的路由优先级——而不只是更多席位。你只为经过验证的交付付费，绝无预付风险。",
    recommended: "推荐",
    plans: [
      {
        key: "starter",
        name: "Starter",
        price: "€9",
        cadence: "/月",
        description: "适合以少量工作量处理复杂任务的个人与小团队。",
        features: [
          "每月 20 个任务",
          "任务纳入、格式化与拆解",
          "匹配 AI 智能体或人类专家",
          "标准验证与托管",
          "邮件支持",
        ],
        cta: "选择 Starter",
        href: "/register",
      },
      {
        key: "pro",
        name: "Pro",
        price: "€19",
        cadence: "/月",
        description: "适合在生产环境执行复杂工作、需要优先匹配与文档纳入的团队。",
        features: [
          "无限任务",
          "文档纳入（规格、数据、设计稿）",
          "在智能体与专家之间优先匹配",
          "更高的任务并发",
          "完整的审计日志与分析",
          "高级验证与托管层",
          "最多 10 个团队席位",
        ],
        cta: "选择 Pro",
        href: "/register",
        featured: true,
      },
      {
        key: "enterprise",
        name: "Enterprise",
        price: "定制",
        cadence: "联系销售",
        description: "适合需要专属产能、安全评审与保障的组织。",
        features: [
          "专属的智能体与专家产能",
          "定制验证流水线",
          "SSO 与高级访问控制",
          "安全评审与合规",
          "商业 SLA",
          "专属上手与支持",
        ],
        cta: "联系销售",
        href: "/company/contact",
      },
    ],
    compareEyebrow: "方案对比",
    compareTitle: "看看每个方案包含什么。",
    compareCols: ["能力", "Starter", "Pro", "Enterprise"],
    compareRows: [
      ["任务量", "20 / 月", "无限", "无限"],
      ["文档纳入", "基础", "高级", "定制"],
      ["拆解与排序", "基础", "高级", "定制"],
      ["审计记录", "基础", "完整", "完整"],
      ["验证层", "标准", "扩展", "定制"],
      ["团队席位", "1", "10", "无限"],
      ["支持", "邮件", "优先", "专属"],
      ["商业 SLA", "无", "无", "有"],
    ],
    entEyebrow: "Enterprise",
    entTitle: "治理与规模，内建于生命周期。",
    entBody:
      "Enterprise 面向既看重速度、也需要采购对齐、安全评审与运营控制的组织。它绝不只是更多席位。",
    entPoints: [
      { title: "治理", body: "安全控制、SSO 与流程治理内建于每个任务生命周期。" },
      { title: "专属产能", body: "预留的智能体池与按你的标准调校的定制验证流水线。" },
      { title: "商业保障", body: "面向采购的 SLA、部署选项与专属上手服务。" },
    ],
    entCta: "联系销售",
    faqEyebrow: "常见问题",
    faqTitle: "价格相关问题解答。",
    faqs: [
      {
        q: "Starter 与 Pro 有何区别？",
        a: "Pro 为生产环境的复杂工作而生。每月 19 欧元即可获得无限任务、文档纳入、在智能体与专家之间的优先匹配、更高并发与完整审计——而 9 欧元的 Starter 方案为每月 20 个任务。",
      },
      {
        q: "何时应考虑 Enterprise？",
        a: "Enterprise 面向既看重速度、也需要专属产能、SSO、安全评审、商业 SLA 与采购对齐的组织——而不只是更多席位。",
      },
      {
        q: "我需要在工作验证前付款吗？",
        a: "不需要。资金存于托管，仅对通过验证的工作释放。界定的任务、匹配的智能体与交付验证在每个阶段守护你的支出。",
      },
      {
        q: "之后可以升级吗？",
        a: "可以。随着需求增长，你可随时升级。Enterprise 条款会在上手阶段按你的具体需求定制。",
      },
    ],
  },
};

export default function PricingPage() {
  const { locale } = useTranslation();
  const c = COPY[locale] ?? COPY.en;
  const [openIndex, setOpenIndex] = useState<number | null>(0);

  return (
    <div className="min-h-screen bg-ink-950 text-ink-50">
      <PageHero
        eyebrow={c.eyebrow}
        title={c.title}
        accent={c.accent}
        description={c.description}
        icon={Banknote}
      />

      {/* Plans */}
      <section className="px-4 pb-20 sm:px-6 lg:px-8">
        <div className="mx-auto grid max-w-6xl gap-6 lg:grid-cols-3">
          {c.plans.map((plan, i) => (
            <Reveal
              key={plan.key}
              delay={i * 80}
              className={`hover-lift relative flex flex-col rounded-lg p-8 ${
                plan.featured
                  ? "border-2 border-signal-500 bg-ink-900 shadow-glow"
                  : "border border-ink-700 bg-ink-900 shadow-panel hover:border-signal-500/40"
              }`}
            >
              {plan.featured ? (
                <div className="absolute -top-3 left-8 inline-flex items-center gap-1.5 rounded-sm bg-signal-500 px-3 py-1 font-mono text-[11px] font-semibold uppercase tracking-wider text-ink-950">
                  <Sparkles className="h-3 w-3" />
                  {c.recommended}
                </div>
              ) : null}
              <p className="eyebrow text-signal-400">{plan.name}</p>
              <div className="mt-4 flex items-end gap-2">
                <span className="font-display text-4xl font-medium text-ink-50">{plan.price}</span>
                <span className="pb-1 text-sm text-ink-500">{plan.cadence}</span>
              </div>
              <p className="mt-5 text-sm leading-7 text-ink-400">{plan.description}</p>

              <div className="mt-7">
                <Link
                  href={plan.href}
                  className={`inline-flex h-12 w-full items-center justify-center gap-2 rounded-md text-sm font-semibold transition-all ${
                    plan.featured
                      ? "bg-signal-500 text-ink-950 hover:bg-signal-400 hover:shadow-glow-sm"
                      : "border border-ink-600 bg-transparent text-ink-100 hover:border-ink-400 hover:bg-ink-800"
                  }`}
                >
                  {plan.cta}
                  <ArrowRight className="h-4 w-4" />
                </Link>
              </div>

              <div className="mt-8 space-y-3">
                {plan.features.map((feature) => (
                  <div key={feature} className="flex items-start gap-3">
                    <Check className="mt-0.5 h-4 w-4 shrink-0 text-signal-400" />
                    <span className="text-sm leading-6 text-ink-300">{feature}</span>
                  </div>
                ))}
              </div>
            </Reveal>
          ))}
        </div>
      </section>

      {/* Comparison */}
      <section className="relative border-y border-paper-ink/15 bg-paper px-4 py-20 text-paper-ink sm:px-6 lg:px-8">
        <div className="pointer-events-none absolute inset-0 bg-grid-paper" aria-hidden="true" />
        <div className="relative mx-auto max-w-5xl">
          <Reveal className="eyebrow text-signal-600">{c.compareEyebrow}</Reveal>
          <Reveal delay={70}>
            <h2 className="mt-3 font-display text-3xl font-medium text-paper-ink sm:text-4xl">
              {c.compareTitle}
            </h2>
          </Reveal>

          <Reveal delay={140} className="mt-10 overflow-x-auto rounded-lg border border-paper-ink/15 bg-paper">
            <div className="min-w-[560px]">
              <div className="grid grid-cols-4 border-b border-paper-ink/15 bg-paper-deep font-mono text-xs uppercase tracking-wider text-paper-ink/60">
                {c.compareCols.map((col, i) => (
                  <div
                    key={col}
                    className={`px-5 py-4 ${i === 2 ? "text-signal-600" : ""} ${i > 0 ? "text-center" : ""}`}
                  >
                    {col}
                  </div>
                ))}
              </div>
              {c.compareRows.map((row) => (
                <div
                  key={row[0]}
                  className="grid grid-cols-4 border-b border-paper-ink/15 text-sm text-paper-ink/70 last:border-b-0"
                >
                  <div className="px-5 py-4 font-medium text-paper-ink">{row[0]}</div>
                  <div className="px-5 py-4 text-center">{row[1]}</div>
                  <div className="px-5 py-4 text-center font-medium text-paper-ink">{row[2]}</div>
                  <div className="px-5 py-4 text-center">{row[3]}</div>
                </div>
              ))}
            </div>
          </Reveal>
        </div>
      </section>

      {/* Enterprise */}
      <section id="enterprise" className="px-4 py-20 sm:px-6 lg:px-8">
        <div className="mx-auto max-w-6xl">
          <div className="grid gap-10 lg:grid-cols-[0.9fr_1.1fr] lg:items-start">
            <div>
              <Reveal className="eyebrow inline-flex items-center gap-2 rounded-full border border-ink-700 bg-ink-900/80 px-4 py-1.5 text-ink-300">
                <Building2 className="h-3.5 w-3.5 text-signal-400" />
                {c.entEyebrow}
              </Reveal>
              <Reveal delay={80}>
                <h2 className="mt-6 font-display text-3xl font-medium text-ink-50 sm:text-4xl">
                  {c.entTitle}
                </h2>
              </Reveal>
              <Reveal delay={140}>
                <p className="mt-5 max-w-xl text-lg leading-8 text-ink-300">{c.entBody}</p>
              </Reveal>
              <Reveal delay={200} className="mt-8">
                <Link
                  href="/company/contact"
                  className="inline-flex h-12 items-center justify-center gap-2 rounded-md bg-signal-500 px-7 text-sm font-semibold text-ink-950 transition-all hover:bg-signal-400 hover:shadow-glow-sm"
                >
                  {c.entCta}
                  <ArrowRight className="h-4 w-4" />
                </Link>
              </Reveal>
            </div>

            <div className="grid gap-5 sm:grid-cols-3 lg:grid-cols-1">
              {c.entPoints.map((point, i) => {
                const Icon = ENT_ICONS[i] ?? Lock;
                return (
                  <Reveal
                    key={point.title}
                    delay={i * 80}
                    className="hover-lift rounded-lg border border-ink-700 bg-ink-900 p-6 hover:border-signal-500/40 lg:flex lg:items-start lg:gap-4"
                  >
                    <div className="flex h-11 w-11 shrink-0 items-center justify-center rounded-sm border border-signal-500/30 bg-signal-500/10 text-signal-400">
                      <Icon className="h-5 w-5" />
                    </div>
                    <div className="mt-4 lg:mt-0">
                      <h3 className="text-base font-semibold text-ink-50">{point.title}</h3>
                      <p className="mt-2 text-sm leading-7 text-ink-400">{point.body}</p>
                    </div>
                  </Reveal>
                );
              })}
            </div>
          </div>
        </div>
      </section>

      {/* FAQ */}
      <section id="faq" className="px-4 pb-24 sm:px-6 lg:px-8">
        <div className="mx-auto max-w-3xl">
          <Reveal className="eyebrow text-signal-500">{c.faqEyebrow}</Reveal>
          <Reveal delay={70}>
            <h2 className="mt-3 font-display text-3xl font-medium text-ink-50 sm:text-4xl">
              {c.faqTitle}
            </h2>
          </Reveal>

          <div className="mt-10 space-y-3">
            {c.faqs.map((item, index) => {
              const isOpen = openIndex === index;
              return (
                <Reveal
                  key={item.q}
                  delay={index * 60}
                  className="overflow-hidden rounded-lg border border-ink-700 bg-ink-900"
                >
                  <button
                    type="button"
                    className="flex w-full items-center justify-between gap-6 px-6 py-5 text-left"
                    onClick={() => setOpenIndex(isOpen ? null : index)}
                    aria-expanded={isOpen}
                  >
                    <span className="text-base font-semibold text-ink-50">{item.q}</span>
                    <ChevronDown
                      className={`h-5 w-5 shrink-0 text-ink-500 transition-transform duration-300 ${
                        isOpen ? "rotate-180 text-signal-400" : ""
                      }`}
                    />
                  </button>
                  {isOpen ? (
                    <p className="px-6 pb-6 text-sm leading-7 text-ink-400">{item.a}</p>
                  ) : null}
                </Reveal>
              );
            })}
          </div>
        </div>
      </section>
    </div>
  );
}
