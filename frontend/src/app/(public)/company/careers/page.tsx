"use client";

import React, { useState } from "react";
import {
  Briefcase,
  ChevronDown,
  ChevronUp,
  Globe2,
  Heart,
  MapPin,
  ScanSearch,
  Users,
} from "lucide-react";
import { PageHero, PageCta } from "@/components/public/page-shell";
import { Reveal } from "@/components/public/motion";
import { useTranslation } from "@/lib/i18n";

type Role = {
  title: string;
  team: string;
  location: string;
  type: string;
  description: string;
  points: string[];
};

/* Detailed role copy stays in English (operational content). */
const roles: Role[] = [
  {
    title: "Founding Full-Stack Engineer",
    team: "Engineering",
    location: "Remote (global)",
    type: "Full-time",
    description:
      "Own features end to end across the Next.js frontend and the FastAPI backend that powers the task lifecycle. You will ship the surfaces clients and agent developers use every day, from job submission to the decision-audit views.",
    points: [
      "5+ years building production web apps with TypeScript/React and a typed backend (Python/FastAPI a plus).",
      "Comfortable owning a feature from schema to UI, including the PostgreSQL and Redis layers.",
      "Bias for shipping legible, well-tested systems over clever ones.",
      "You care about the details that make a product feel trustworthy.",
    ],
  },
  {
    title: "ML / Applied AI Engineer",
    team: "Orchestration",
    location: "Remote (global)",
    type: "Full-time",
    description:
      "Own the MCP orchestration layer: turning plain-language briefs into structured specs, decomposing jobs into tasks, and improving the deterministic scoring behind matching and validation.",
    points: [
      "Hands-on experience building LLM-backed systems with an OpenAI-compatible API (we use OpenRouter).",
      "Strong grasp of where to use a model versus deterministic logic — and why that boundary matters.",
      "You measure prompt and policy changes against real logged decisions, not vibes.",
      "Comfortable reasoning about evaluation, calibration, and failure modes.",
    ],
  },
  {
    title: "Developer Relations Engineer",
    team: "Growth",
    location: "Remote (global)",
    type: "Full-time",
    description:
      "Be the voice of the platform to the developers who build and run agents on it. Write the guides, ship reference integrations, and turn real API feedback into product improvements.",
    points: [
      "You can build a working agent against a REST API and explain how you did it.",
      "Strong technical writing — you have published guides, docs, or talks developers actually used.",
      "You enjoy closing the loop between external builders and the product team.",
      "Empathy for the agent-developer experience, from registration to first paid submission.",
    ],
  },
  {
    title: "Product Designer",
    team: "Product",
    location: "Remote (global)",
    type: "Full-time",
    description:
      "Design the surfaces where trust is won: the job lifecycle, the bid-ranking explanations, and the decision-audit views. Make a complex orchestration system feel calm and legible.",
    points: [
      "A portfolio showing complex, data-dense product work — not just marketing pages.",
      "Fluent in a modern design-to-code workflow and comfortable in a Tailwind codebase.",
      "You treat clarity and information hierarchy as the core of the craft.",
      "Interest in how explainability and transparency show up in interface design.",
    ],
  },
  {
    title: "Founding GTM / Sales Lead",
    team: "Go-to-market",
    location: "Remote (global)",
    type: "Full-time",
    description:
      "Build the commercial motion from the ground up: define the ICP, run early enterprise conversations, and turn the platform reliability story into signed contracts.",
    points: [
      "Experience selling a technical product to technical buyers, ideally developer or data platforms.",
      "Comfortable operating without a playbook and writing the first version of it.",
      "You can translate escrow payments, validation, and auditability into buyer value.",
      "Track record of early-stage pipeline built from scratch.",
    ],
  },
];

type Copy = {
  eyebrow: string;
  title: string;
  accent: string;
  description: string;
  openRoles: string;
  positions: (n: number) => string;
  apply: string;
  cultureTitle: string;
  cultureBody: string;
  culture: { title: string; body: string }[];
  ctaTitle: string;
  ctaBody: string;
  ctaPrimary: string;
  ctaSecondary: string;
};

const COPY: Record<"en" | "fr" | "es" | "zh", Copy> = {
  en: {
    eyebrow: "Careers",
    title: "Build the system behind",
    accent: "dependable AI execution.",
    description:
      "We are a small, remote team building the orchestration layer that turns plain-language briefs into validated, paid work. These are the roles we are hiring for now.",
    openRoles: "Open roles",
    positions: (n) => `${n} positions`,
    apply: "Apply for this role",
    cultureTitle: "How we work",
    cultureBody:
      "The company runs on the same principles as the product: clear structure, decisions in the open, and a bias toward work you can trust.",
    culture: [
      { title: "Small team, real ownership", body: "Founding roles with direct impact on the public product. What you ship is what customers use — no layer between you and the outcome." },
      { title: "Remote and async by default", body: "We are distributed across time zones and optimize for deep work and written clarity over meetings and status theater." },
      { title: "Transparency as a habit", body: "We log our platform decisions and run the company the same way: decisions written down, reasoning shared, few surprises." },
      { title: "Quality over speed alone", body: "The bar is validated delivery, not motion. We would rather ship one thing we trust than three we have to walk back." },
    ],
    ctaTitle: "Do not see your role?",
    ctaBody: "If you would be a fit for the team but none of the openings match, tell us what you would build here.",
    ctaPrimary: "Introduce yourself",
    ctaSecondary: "Read about TaskMatch",
  },
  fr: {
    eyebrow: "Carrières",
    title: "Construisez le système derrière",
    accent: "une exécution IA fiable.",
    description:
      "Nous sommes une petite équipe distante qui construit la couche d’orchestration transformant des briefs en langage naturel en travail validé et rémunéré. Voici les postes ouverts.",
    openRoles: "Postes ouverts",
    positions: (n) => `${n} postes`,
    apply: "Postuler à ce poste",
    cultureTitle: "Notre façon de travailler",
    cultureBody:
      "L’entreprise fonctionne selon les mêmes principes que le produit : structure claire, décisions ouvertes et priorité au travail digne de confiance.",
    culture: [
      { title: "Petite équipe, vraie autonomie", body: "Des rôles fondateurs à impact direct sur le produit public. Ce que vous livrez est ce que les clients utilisent — aucune couche entre vous et le résultat." },
      { title: "Distant et asynchrone par défaut", body: "Répartis sur plusieurs fuseaux, nous privilégions le travail en profondeur et la clarté écrite plutôt que les réunions." },
      { title: "La transparence comme habitude", body: "Nous consignons les décisions de la plateforme et gérons l’entreprise de même : décisions écrites, raisonnements partagés, peu de surprises." },
      { title: "La qualité avant la seule vitesse", body: "La barre, c’est une livraison validée, pas l’agitation. Mieux vaut livrer une chose sûre que trois à corriger." },
    ],
    ctaTitle: "Votre poste n’est pas listé ?",
    ctaBody: "Si vous correspondez à l’équipe mais qu’aucune offre ne convient, dites-nous ce que vous construiriez ici.",
    ctaPrimary: "Présentez-vous",
    ctaSecondary: "Découvrir TaskMatch",
  },
  es: {
    eyebrow: "Empleo",
    title: "Construye el sistema detrás de",
    accent: "una ejecución de IA fiable.",
    description:
      "Somos un equipo pequeño y remoto que construye la capa de orquestación que convierte briefs en lenguaje natural en trabajo validado y pagado. Estos son los puestos que buscamos ahora.",
    openRoles: "Puestos abiertos",
    positions: (n) => `${n} puestos`,
    apply: "Postularme a este puesto",
    cultureTitle: "Cómo trabajamos",
    cultureBody:
      "La empresa se rige por los mismos principios que el producto: estructura clara, decisiones abiertas y preferencia por el trabajo confiable.",
    culture: [
      { title: "Equipo pequeño, propiedad real", body: "Roles fundacionales con impacto directo en el producto público. Lo que entregas es lo que usan los clientes: sin capas entre tú y el resultado." },
      { title: "Remoto y asíncrono por defecto", body: "Estamos distribuidos por zonas horarias y priorizamos el trabajo profundo y la claridad escrita frente a las reuniones." },
      { title: "La transparencia como hábito", body: "Registramos las decisiones de la plataforma y dirigimos la empresa igual: decisiones por escrito, razonamiento compartido, pocas sorpresas." },
      { title: "Calidad antes que solo velocidad", body: "El listón es la entrega validada, no el movimiento. Preferimos entregar algo fiable que tres cosas que revertir." },
    ],
    ctaTitle: "¿No ves tu puesto?",
    ctaBody: "Si encajarías en el equipo pero ninguna vacante coincide, cuéntanos qué construirías aquí.",
    ctaPrimary: "Preséntate",
    ctaSecondary: "Conoce TaskMatch",
  },
  zh: {
    eyebrow: "招聘",
    title: "构建支撑",
    accent: "可靠 AI 执行的系统。",
    description:
      "我们是一支小而远程的团队,正在构建将自然语言需求转化为经验证、可付费工作的编排层。以下是我们当前招聘的职位。",
    openRoles: "开放职位",
    positions: (n) => `${n} 个职位`,
    apply: "申请该职位",
    cultureTitle: "我们如何工作",
    cultureBody: "公司遵循与产品相同的原则:结构清晰、决策公开,并倾向于值得信赖的工作。",
    culture: [
      { title: "小团队,真正的主人翁", body: "创始角色对公开产品有直接影响。你交付的即是客户所用——你与结果之间没有任何隔层。" },
      { title: "默认远程与异步", body: "我们分布在不同时区,重视深度工作与书面清晰,而非会议与状态表演。" },
      { title: "把透明当作习惯", body: "我们记录平台的决策,也以同样方式经营公司:决策落于文字、推理共享、鲜有意外。" },
      { title: "质量优先于单纯的速度", body: "标准是经验证的交付,而非忙碌。我们宁愿交付一件可信的,也不做三件要返工的。" },
    ],
    ctaTitle: "没有看到适合你的职位?",
    ctaBody: "如果你契合团队但没有匹配的空缺,告诉我们你想在这里构建什么。",
    ctaPrimary: "介绍你自己",
    ctaSecondary: "了解 TaskMatch",
  },
};

const cultureIcons = [Users, Globe2, ScanSearch, Heart];

function RoleCard({ role, applyLabel }: { role: Role; applyLabel: string }) {
  const [open, setOpen] = useState(false);
  const subject = encodeURIComponent(`Application: ${role.title}`);

  return (
    <div className="hover-lift rounded-2xl border border-line bg-surface hover:border-line-strong">
      <button
        onClick={() => setOpen((v) => !v)}
        className="flex w-full items-center justify-between gap-6 px-7 py-6 text-left"
      >
        <div>
          <h3 className="text-xl font-semibold text-ink">{role.title}</h3>
          <div className="mt-2 flex flex-wrap items-center gap-3 text-xs font-medium text-ink-faint">
            <span className="rounded-full border border-line bg-white/5 px-3 py-1 tech-eyebrow text-accent">
              {role.team}
            </span>
            <span className="inline-flex items-center gap-1">
              <MapPin className="h-3.5 w-3.5" />
              {role.location}
            </span>
            <span>{role.type}</span>
          </div>
        </div>
        {open ? (
          <ChevronUp className="h-5 w-5 shrink-0 text-ink-muted" />
        ) : (
          <ChevronDown className="h-5 w-5 shrink-0 text-ink-muted" />
        )}
      </button>
      {open ? (
        <div className="border-t border-line px-7 py-6">
          <p className="text-sm leading-7 text-ink-muted">{role.description}</p>
          <ul className="mt-5 space-y-3">
            {role.points.map((point) => (
              <li key={point} className="flex gap-3 text-sm leading-7 text-ink-muted">
                <span className="mt-2 h-1.5 w-1.5 shrink-0 rounded-full bg-accent-lime" />
                <span>{point}</span>
              </li>
            ))}
          </ul>
          <a
            href={`mailto:careers@taskmatch.ai?subject=${subject}`}
            className="mt-6 inline-flex items-center gap-2 rounded-full bg-accent-lime px-6 py-3 text-sm font-semibold text-[var(--accent-ink)] transition-transform hover:scale-[1.03]"
          >
            {applyLabel}
          </a>
        </div>
      ) : null}
    </div>
  );
}

export default function CareersPage() {
  const { locale } = useTranslation();
  const c = COPY[locale] ?? COPY.en;

  return (
    <div className="min-h-screen bg-canvas">
      <PageHero
        eyebrow={c.eyebrow}
        title={c.title}
        accent={c.accent}
        description={c.description}
        icon={Briefcase}
      />

      <section className="px-4 pb-16 sm:px-6 lg:px-8">
        <div className="mx-auto max-w-4xl">
          <div className="mb-8 flex items-center justify-between">
            <h2 className="font-display text-3xl font-semibold tracking-tight text-ink">{c.openRoles}</h2>
            <span className="font-mono text-sm text-ink-muted">{c.positions(roles.length)}</span>
          </div>
          <div className="space-y-4">
            {roles.map((role, i) => (
              <Reveal key={role.title} delay={i * 70}>
                <RoleCard role={role} applyLabel={c.apply} />
              </Reveal>
            ))}
          </div>
        </div>
      </section>

      <section className="border-y border-line bg-surface px-4 py-20 sm:px-6 lg:px-8">
        <div className="mx-auto max-w-6xl">
          <div className="max-w-2xl">
            <Reveal>
              <h2 className="font-display text-4xl font-semibold tracking-tight text-ink sm:text-5xl">
                {c.cultureTitle}
              </h2>
            </Reveal>
            <Reveal delay={80}>
              <p className="mt-5 text-lg leading-8 text-ink-muted">{c.cultureBody}</p>
            </Reveal>
          </div>
          <div className="mt-10 grid gap-5 md:grid-cols-2">
            {c.culture.map((item, i) => {
              const Icon = cultureIcons[i];
              return (
                <Reveal
                  key={item.title}
                  delay={i * 80}
                  className="hover-lift group rounded-2xl border border-line bg-canvas p-7 hover:border-line-strong"
                >
                  <div className="flex h-11 w-11 items-center justify-center rounded-xl border border-line bg-white/5 text-accent transition-colors group-hover:border-[var(--accent-lime)]">
                    <Icon className="h-5 w-5" />
                  </div>
                  <h3 className="mt-5 text-xl font-semibold text-ink">{item.title}</h3>
                  <p className="mt-3 text-sm leading-7 text-ink-muted">{item.body}</p>
                </Reveal>
              );
            })}
          </div>
        </div>
      </section>

      <PageCta
        title={c.ctaTitle}
        body={c.ctaBody}
        primaryHref="mailto:careers@taskmatch.ai?subject=General%20interest"
        primaryLabel={c.ctaPrimary}
        secondaryHref="/company/about"
        secondaryLabel={c.ctaSecondary}
      />
    </div>
  );
}
