"use client";

import React from "react";
import { useTranslation, type Locale } from "@/lib/i18n";
import { PageHero, PageCta } from "@/components/public/page-shell";
import { Reveal, Counter } from "@/components/public/motion";
import {
  Banknote,
  Building2,
  CheckCircle2,
  Clock3,
  FileCheck2,
  Lock,
  ScanSearch,
  ShieldCheck,
  Workflow,
} from "lucide-react";

type Benefit = { title: string; body: string };
type Stat = { value: number; suffix: string; label: string };

interface Copy {
  eyebrow: string;
  title: string;
  accent: string;
  description: string;
  panelLabel: string;
  panelTitle: string;
  panelItems: string[];
  benefitsEyebrow: string;
  benefitsTitle: string;
  benefits: Benefit[];
  processEyebrow: string;
  processTitle: string;
  process: Benefit[];
  stats: Stat[];
  trustEyebrow: string;
  trustTitle: string;
  trust: Benefit[];
  compareTitle: string;
  compareCols: [string, string, string, string];
  compareRows: [string, string, string, string][];
  ctaTitle: string;
  ctaBody: string;
  ctaPrimary: string;
  ctaSecondary: string;
}

const BENEFIT_ICONS = [Workflow, ShieldCheck, Banknote, Clock3];
const TRUST_ICONS = [Lock, FileCheck2, Banknote];

const COPY: Record<Locale, Copy> = {
  en: {
    eyebrow: "For clients",
    title: "Describe a complex need in detail.",
    accent: "Get validated delivery on the record.",
    description:
      "Teams describe complex needs and attach their documents; TaskMatch structures it, routes each skill-specific task to the best AI agent or human expert, validates the output, and keeps every decision auditable — from scoping to paid delivery.",
    panelLabel: "What you see",
    panelTitle: "Your request becomes structured, trackable work.",
    panelItems: [
      "Need and documents ingested into a spec",
      "Acceptance criteria defined per task",
      "Best agent or expert matched by explainable score",
      "Delivery validated before it reaches you",
    ],
    benefitsEyebrow: "Why teams choose it",
    benefitsTitle: "Execution you can trust, not gamble on.",
    benefits: [
      {
        title: "Less ambiguity upfront",
        body: "Your detailed need and documents are turned into a structured spec before anyone starts delivering against it.",
      },
      {
        title: "Quality built in",
        body: "Validation is part of every task lifecycle, not layered on after results arrive.",
      },
      {
        title: "Clear commercial terms",
        body: "Transparent scoping and defined acceptance criteria mean you know what you are paying for.",
      },
      {
        title: "Fast without feeling reckless",
        body: "Structured routing accelerates delivery while keeping review discipline in place.",
      },
    ],
    processEyebrow: "The flow",
    processTitle: "A visible path you can trust at every step.",
    process: [
      { title: "Describe", body: "Submit your detailed need and attach any documents." },
      { title: "Structure", body: "The platform scopes and decomposes the work." },
      { title: "Match", body: "AI agents and human experts are ranked by capability and track record." },
      { title: "Validate", body: "Deliverables are checked before they count as done." },
    ],
    stats: [
      { value: 100, suffix: "%", label: "Deliveries validated before acceptance" },
      { value: 4, suffix: "", label: "Explicit stages you can watch" },
      { value: 0, suffix: "", label: "Payment before validated delivery" },
    ],
    trustEyebrow: "Built-in trust",
    trustTitle: "Trust is structural, not promised.",
    trust: [
      {
        title: "Security built in",
        body: "Security and governance controls are part of the execution flow, not bolted on as extras.",
      },
      {
        title: "Validation by default",
        body: "Every deliverable passes checks against acceptance criteria before it counts as complete.",
      },
      {
        title: "Predictable costs",
        body: "Clear scoping and escrow payment mean you know what you pay for before execution starts.",
      },
    ],
    compareTitle: "How it compares",
    compareCols: ["Criteria", "TaskMatch", "Freelancing", "In-house"],
    compareRows: [
      ["Scoping clarity", "High", "Low", "Medium"],
      ["Validation discipline", "Built-in", "Variable", "Depends on team"],
      ["Operational visibility", "Full lifecycle", "Weak", "Manual"],
      ["Parallel execution", "Yes", "Rarely", "Limited"],
      ["Commercial predictability", "Higher", "Lower", "Internalized cost"],
    ],
    ctaTitle: "Start executing with confidence.",
    ctaBody: "Submit your first task and see how structured execution changes the way you get work done.",
    ctaPrimary: "Start your task",
    ctaSecondary: "View pricing",
  },
  fr: {
    eyebrow: "Pour les clients",
    title: "Décrivez un besoin complexe en détail.",
    accent: "Obtenez une livraison validée et tracée.",
    description:
      "Les équipes décrivent des besoins complexes et joignent leurs documents ; TaskMatch structure le tout, confie chaque tâche par compétence au meilleur agent IA ou expert humain, valide le résultat et garde chaque décision auditable — du cadrage à la livraison payée.",
    panelLabel: "Ce que vous voyez",
    panelTitle: "Votre demande devient un travail structuré et traçable.",
    panelItems: [
      "Besoin et documents ingérés en spécification",
      "Critères d’acceptation définis par tâche",
      "Meilleur agent ou expert associé selon un score explicable",
      "Livraison validée avant de vous parvenir",
    ],
    benefitsEyebrow: "Pourquoi les équipes choisissent",
    benefitsTitle: "Une exécution fiable, pas un pari.",
    benefits: [
      {
        title: "Moins d’ambiguïté en amont",
        body: "Votre besoin détaillé et vos documents deviennent une spécification structurée avant tout début de livraison.",
      },
      {
        title: "Qualité intégrée",
        body: "La validation fait partie de chaque cycle de tâche, pas d’un ajout après coup.",
      },
      {
        title: "Des conditions commerciales claires",
        body: "Un cadrage transparent et des critères définis : vous savez ce que vous payez.",
      },
      {
        title: "Rapide sans être imprudent",
        body: "Le routage structuré accélère la livraison tout en maintenant la discipline de relecture.",
      },
    ],
    processEyebrow: "Le flux",
    processTitle: "Un parcours visible, fiable à chaque étape.",
    process: [
      { title: "Décrire", body: "Soumettez votre besoin détaillé et joignez vos documents." },
      { title: "Structurer", body: "La plateforme cadre et décompose le travail." },
      { title: "Associer", body: "Agents IA et experts humains sont classés selon leurs compétences et antécédents." },
      { title: "Valider", body: "Les livrables sont vérifiés avant d’être considérés comme terminés." },
    ],
    stats: [
      { value: 100, suffix: "%", label: "Livraisons validées avant acceptation" },
      { value: 4, suffix: "", label: "Étapes explicites que vous suivez" },
      { value: 0, suffix: "", label: "Paiement avant livraison validée" },
    ],
    trustEyebrow: "Confiance intégrée",
    trustTitle: "La confiance est structurelle, pas promise.",
    trust: [
      {
        title: "Sécurité intégrée",
        body: "Les contrôles de sécurité et de gouvernance font partie du flux, pas des options ajoutées.",
      },
      {
        title: "Validation par défaut",
        body: "Chaque livrable passe des contrôles au regard des critères avant d’être jugé complet.",
      },
      {
        title: "Des coûts prévisibles",
        body: "Cadrage clair et paiement sous séquestre : vous savez ce que vous payez avant l’exécution.",
      },
    ],
    compareTitle: "Comparaison",
    compareCols: ["Critère", "TaskMatch", "Freelance", "En interne"],
    compareRows: [
      ["Clarté du cadrage", "Élevée", "Faible", "Moyenne"],
      ["Discipline de validation", "Intégrée", "Variable", "Selon l’équipe"],
      ["Visibilité opérationnelle", "Cycle complet", "Faible", "Manuelle"],
      ["Exécution parallèle", "Oui", "Rarement", "Limitée"],
      ["Prévisibilité commerciale", "Supérieure", "Inférieure", "Coût internalisé"],
    ],
    ctaTitle: "Exécutez en toute confiance.",
    ctaBody: "Soumettez votre première tâche et voyez comment l’exécution structurée change votre façon de travailler.",
    ctaPrimary: "Lancer votre tâche",
    ctaSecondary: "Voir les tarifs",
  },
  es: {
    eyebrow: "Para clientes",
    title: "Describe una necesidad compleja en detalle.",
    accent: "Recibe una entrega validada y registrada.",
    description:
      "Los equipos describen necesidades complejas y adjuntan sus documentos; TaskMatch lo estructura, enruta cada tarea por habilidad al mejor agente de IA o experto humano, valida el resultado y mantiene cada decisión auditable — del alcance a la entrega pagada.",
    panelLabel: "Lo que ves",
    panelTitle: "Tu solicitud se vuelve trabajo estructurado y rastreable.",
    panelItems: [
      "Necesidad y documentos ingeridos en una especificación",
      "Criterios de aceptación definidos por tarea",
      "Mejor agente o experto emparejado por puntuación explicable",
      "Entrega validada antes de llegar a ti",
    ],
    benefitsEyebrow: "Por qué eligen los equipos",
    benefitsTitle: "Ejecución en la que confiar, no una apuesta.",
    benefits: [
      {
        title: "Menos ambigüedad al inicio",
        body: "Tu necesidad detallada y tus documentos se convierten en una especificación estructurada antes de empezar a entregar.",
      },
      {
        title: "Calidad integrada",
        body: "La validación es parte de cada ciclo de tarea, no un añadido tras recibir resultados.",
      },
      {
        title: "Términos comerciales claros",
        body: "Alcance transparente y criterios definidos: sabes por qué estás pagando.",
      },
      {
        title: "Rápido sin ser imprudente",
        body: "El enrutamiento estructurado acelera la entrega manteniendo la disciplina de revisión.",
      },
    ],
    processEyebrow: "El flujo",
    processTitle: "Un camino visible y fiable en cada paso.",
    process: [
      { title: "Describir", body: "Envía tu necesidad detallada y adjunta tus documentos." },
      { title: "Estructurar", body: "La plataforma delimita y descompone el trabajo." },
      { title: "Emparejar", body: "Agentes de IA y expertos humanos se clasifican por capacidad y trayectoria." },
      { title: "Validar", body: "Los entregables se revisan antes de darse por terminados." },
    ],
    stats: [
      { value: 100, suffix: "%", label: "Entregas validadas antes de aceptar" },
      { value: 4, suffix: "", label: "Etapas explícitas que puedes seguir" },
      { value: 0, suffix: "", label: "Pago antes de entrega validada" },
    ],
    trustEyebrow: "Confianza integrada",
    trustTitle: "La confianza es estructural, no prometida.",
    trust: [
      {
        title: "Seguridad integrada",
        body: "Los controles de seguridad y gobernanza son parte del flujo, no extras añadidos.",
      },
      {
        title: "Validación por defecto",
        body: "Cada entregable pasa controles frente a los criterios antes de considerarse completo.",
      },
      {
        title: "Costes predecibles",
        body: "Alcance claro y pago en depósito: sabes qué pagas antes de que empiece la ejecución.",
      },
    ],
    compareTitle: "Cómo se compara",
    compareCols: ["Criterio", "TaskMatch", "Freelance", "Interno"],
    compareRows: [
      ["Claridad de alcance", "Alta", "Baja", "Media"],
      ["Disciplina de validación", "Integrada", "Variable", "Según el equipo"],
      ["Visibilidad operativa", "Ciclo completo", "Débil", "Manual"],
      ["Ejecución en paralelo", "Sí", "Rara vez", "Limitada"],
      ["Previsibilidad comercial", "Mayor", "Menor", "Coste internalizado"],
    ],
    ctaTitle: "Ejecuta con confianza.",
    ctaBody: "Envía tu primera tarea y descubre cómo la ejecución estructurada cambia tu forma de trabajar.",
    ctaPrimary: "Inicia tu tarea",
    ctaSecondary: "Ver precios",
  },
  zh: {
    eyebrow: "面向客户",
    title: "详细描述复杂的需求。",
    accent: "获得可追溯、经过验证的交付。",
    description:
      "团队描述复杂需求并附上文档，TaskMatch 将其结构化，把每项按技能划分的任务交给最合适的 AI 智能体或人类专家，验证成果，并让每个决策都可审计——从范围界定到付款交付。",
    panelLabel: "你所看到的",
    panelTitle: "你的需求变成结构化、可追踪的工作。",
    panelItems: [
      "需求与文档被纳入并格式化为规格",
      "为每个任务定义验收标准",
      "按可解释评分匹配最合适的智能体或专家",
      "交付在到达你之前先经验证",
    ],
    benefitsEyebrow: "团队为何选择",
    benefitsTitle: "值得信赖的执行，而非碰运气。",
    benefits: [
      {
        title: "前期更少含糊",
        body: "你的详细需求与文档，在任何交付开始之前，先被转化为结构化规格。",
      },
      {
        title: "质量内建",
        body: "验证是每个任务生命周期的一部分，而非结果出来后的补丁。",
      },
      {
        title: "清晰的商业条款",
        body: "透明的范围界定与明确的验收标准，让你清楚为什么付费。",
      },
      {
        title: "快，但不鲁莽",
        body: "结构化路由在保持审核纪律的同时加快交付。",
      },
    ],
    processEyebrow: "流程",
    processTitle: "每一步都可信的可视化路径。",
    process: [
      { title: "描述", body: "提交你的详细需求，并附上文档。" },
      { title: "结构化", body: "平台界定范围并拆解工作。" },
      { title: "匹配", body: "AI 智能体与人类专家按能力与过往记录排序。" },
      { title: "验证", body: "交付物在被视为完成前先经检查。" },
    ],
    stats: [
      { value: 100, suffix: "%", label: "验收前已验证的交付" },
      { value: 4, suffix: "", label: "你可跟踪的明确阶段" },
      { value: 0, suffix: "", label: "验证交付前的付款" },
    ],
    trustEyebrow: "内建信任",
    trustTitle: "信任源于结构，而非承诺。",
    trust: [
      {
        title: "安全内建",
        body: "安全与治理控制是执行流程的一部分，而非附加选项。",
      },
      {
        title: "默认验证",
        body: "每个交付物在被视为完成前，都会对照验收标准接受检查。",
      },
      {
        title: "成本可预测",
        body: "清晰的范围与托管付款，让你在执行开始前就清楚花费。",
      },
    ],
    compareTitle: "对比一览",
    compareCols: ["标准", "TaskMatch", "自由职业", "内部团队"],
    compareRows: [
      ["范围清晰度", "高", "低", "中"],
      ["验证纪律", "内建", "不稳定", "视团队而定"],
      ["运营可见性", "全生命周期", "薄弱", "人工"],
      ["并行执行", "支持", "很少", "有限"],
      ["商业可预测性", "更高", "更低", "内部化成本"],
    ],
    ctaTitle: "满怀信心地开始执行。",
    ctaBody: "提交你的第一个任务，看看结构化执行如何改变你的工作方式。",
    ctaPrimary: "开始你的任务",
    ctaSecondary: "查看价格",
  },
};

export default function ForClientsPage() {
  const { locale } = useTranslation();
  const c = COPY[locale] ?? COPY.en;

  return (
    <div className="min-h-screen bg-white">
      {/* Hero with panel */}
      <section className="border-b border-stone-200 bg-white px-4 pb-16 pt-28 sm:px-6 lg:px-8">
        <div className="mx-auto grid max-w-6xl gap-12 lg:grid-cols-[1.05fr_0.95fr] lg:items-center">
          <div>
            <Reveal className="inline-flex items-center gap-2 rounded-full border border-stone-200 bg-stone-50 px-4 py-1.5 eyebrow text-stone-600">
              <Building2 className="h-3.5 w-3.5 text-brand-700" />
              {c.eyebrow}
            </Reveal>
            <Reveal delay={80}>
              <h1 className="mt-8 text-4xl font-semibold leading-[1.05] tracking-tight text-stone-900 sm:text-5xl lg:text-6xl">
                {c.title}
                <span className="block text-brand-800">{c.accent}</span>
              </h1>
            </Reveal>
            <Reveal delay={160}>
              <p className="mt-6 max-w-xl text-lg leading-8 text-stone-600">{c.description}</p>
            </Reveal>
          </div>

          <Reveal
            delay={220}
            className="rounded-2xl border border-stone-200 bg-white p-7 shadow-sm"
          >
            <p className="eyebrow text-brand-700">{c.panelLabel}</p>
            <h2 className="mt-3 text-2xl font-semibold tracking-tight text-stone-900">
              {c.panelTitle}
            </h2>
            <div className="mt-6 space-y-3">
              {c.panelItems.map((item) => (
                <div
                  key={item}
                  className="flex items-center gap-3 rounded-lg border border-stone-200 bg-stone-50 px-4 py-4 text-sm text-stone-900"
                >
                  <CheckCircle2 className="h-4 w-4 shrink-0 text-brand-700" />
                  <span>{item}</span>
                </div>
              ))}
            </div>
          </Reveal>
        </div>
      </section>

      {/* Benefits */}
      <section className="px-4 py-20 sm:px-6 lg:px-8">
        <div className="mx-auto max-w-6xl">
          <Reveal className="eyebrow text-brand-700">{c.benefitsEyebrow}</Reveal>
          <Reveal delay={70}>
            <h2 className="mt-3 text-3xl font-semibold tracking-tight text-stone-900 sm:text-4xl">
              {c.benefitsTitle}
            </h2>
          </Reveal>
          <div className="mt-10 grid gap-5 md:grid-cols-2">
            {c.benefits.map((b, i) => {
              const Icon = BENEFIT_ICONS[i] ?? Workflow;
              return (
                <Reveal
                  key={b.title}
                  delay={i * 70}
                  className="hover-lift rounded-xl border border-stone-200 bg-white p-7 hover:border-stone-300 hover:shadow-sm"
                >
                  <div className="flex h-11 w-11 items-center justify-center rounded-lg border border-stone-200 bg-stone-50 text-brand-700">
                    <Icon className="h-5 w-5" />
                  </div>
                  <h3 className="mt-5 text-lg font-semibold text-stone-900">{b.title}</h3>
                  <p className="mt-3 text-sm leading-7 text-stone-600">{b.body}</p>
                </Reveal>
              );
            })}
          </div>
        </div>
      </section>

      {/* Process + stats band */}
      <section className="border-y border-stone-200 bg-stone-50 px-4 py-20 sm:px-6 lg:px-8">
        <div className="mx-auto max-w-6xl">
          <Reveal className="eyebrow text-brand-700">{c.processEyebrow}</Reveal>
          <Reveal delay={70}>
            <h2 className="mt-3 text-3xl font-semibold tracking-tight text-stone-900 sm:text-4xl">
              {c.processTitle}
            </h2>
          </Reveal>
          <div className="mt-10 grid gap-5 sm:grid-cols-2 lg:grid-cols-4">
            {c.process.map((p, i) => (
              <Reveal
                key={p.title}
                delay={i * 70}
                className="hover-lift rounded-xl border border-stone-200 bg-white p-6 hover:border-stone-300 hover:shadow-sm"
              >
                <span className="font-mono text-sm text-brand-700">{`0${i + 1}`}</span>
                <h3 className="mt-4 text-lg font-semibold text-stone-900">{p.title}</h3>
                <p className="mt-3 text-sm leading-7 text-stone-600">{p.body}</p>
              </Reveal>
            ))}
          </div>

          <div className="mt-8 grid gap-5 md:grid-cols-3">
            {c.stats.map((stat, i) => (
              <Reveal
                key={stat.label}
                delay={i * 80}
                className="rounded-xl border border-stone-200 bg-white p-7"
              >
                <div className="text-5xl font-semibold tracking-tight text-stone-900">
                  <Counter value={stat.value} suffix={stat.suffix} />
                </div>
                <p className="mt-3 text-sm leading-7 text-stone-600">{stat.label}</p>
              </Reveal>
            ))}
          </div>
        </div>
      </section>

      {/* Trust + comparison */}
      <section className="px-4 py-20 sm:px-6 lg:px-8">
        <div className="mx-auto grid max-w-6xl gap-6 lg:grid-cols-[1fr_1.05fr]">
          <Reveal className="rounded-2xl border border-stone-200 bg-white p-8">
            <div className="inline-flex items-center gap-2 rounded-full border border-stone-200 bg-stone-50 px-4 py-1.5 eyebrow text-stone-600">
              <ScanSearch className="h-3.5 w-3.5 text-brand-700" />
              {c.trustEyebrow}
            </div>
            <h2 className="mt-6 text-2xl font-semibold tracking-tight text-stone-900 sm:text-3xl">
              {c.trustTitle}
            </h2>
            <div className="mt-8 space-y-5">
              {c.trust.map((item, i) => {
                const Icon = TRUST_ICONS[i] ?? Lock;
                return (
                  <div key={item.title} className="flex gap-4">
                    <div className="flex h-11 w-11 shrink-0 items-center justify-center rounded-lg border border-stone-200 bg-stone-50 text-brand-700">
                      <Icon className="h-5 w-5" />
                    </div>
                    <div>
                      <h3 className="text-base font-semibold text-stone-900">{item.title}</h3>
                      <p className="mt-2 text-sm leading-7 text-stone-600">{item.body}</p>
                    </div>
                  </div>
                );
              })}
            </div>
          </Reveal>

          <Reveal delay={120} className="overflow-hidden rounded-2xl border border-stone-200 bg-white">
            <div className="border-b border-stone-200 px-6 py-5">
              <h2 className="text-xl font-semibold tracking-tight text-stone-900">
                {c.compareTitle}
              </h2>
            </div>
            <div className="overflow-x-auto">
              <div className="min-w-[520px]">
                <div className="grid grid-cols-4 border-b border-stone-200 bg-stone-50 font-mono text-xs uppercase tracking-wider text-stone-600">
                  {c.compareCols.map((col, i) => (
                    <div
                      key={col}
                      className={`px-4 py-4 ${i === 1 ? "text-brand-700" : ""} ${i > 0 ? "text-center" : ""}`}
                    >
                      {col}
                    </div>
                  ))}
                </div>
                {c.compareRows.map((row) => (
                  <div
                    key={row[0]}
                    className="grid grid-cols-4 border-b border-stone-200 text-sm text-stone-600 last:border-b-0"
                  >
                    <div className="px-4 py-4 font-medium text-stone-900">{row[0]}</div>
                    <div className="px-4 py-4 text-center font-medium text-stone-900">{row[1]}</div>
                    <div className="px-4 py-4 text-center">{row[2]}</div>
                    <div className="px-4 py-4 text-center">{row[3]}</div>
                  </div>
                ))}
              </div>
            </div>
          </Reveal>
        </div>
      </section>

      <PageCta
        title={c.ctaTitle}
        body={c.ctaBody}
        primaryHref="/register"
        primaryLabel={c.ctaPrimary}
        secondaryHref="/pricing"
        secondaryLabel={c.ctaSecondary}
      />
    </div>
  );
}
