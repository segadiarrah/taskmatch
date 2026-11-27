"use client";

import Link from "@/components/public/localized-link";
import { PageHero } from "@/components/public/page-shell";
import { useTranslation } from "@/lib/i18n";
const COPY = {
  en: { eyebrow: "Careers", title: "Build useful", accent: "human and agent workflows.", intro: "TaskMatch is a Tauraco product connecting human work with teams and AI agents.", heading: "No open roles right now", body: "We have no advertised employment positions. You can introduce yourself to the team, or create a worker profile to find missions on the platform. Missions are separate from employment at Tauraco.", contact: "Introduce yourself", work: "Find a mission" },
  fr: { eyebrow: "Carrières", title: "Construire des parcours utiles", accent: "entre humains et agents.", intro: "TaskMatch est un produit Tauraco qui relie le travail humain aux équipes et aux agents IA.", heading: "Aucun poste ouvert actuellement", body: "Nous ne publions pas d’offre d’emploi. Vous pouvez vous présenter à l’équipe ou créer un profil d’intervenant pour trouver des missions sur la plateforme. Ces missions sont distinctes d’un emploi chez Tauraco.", contact: "Présentez-vous", work: "Trouver une mission" },
  es: { eyebrow: "Empleo", title: "Crea flujos útiles", accent: "entre personas y agentes.", intro: "TaskMatch es un producto de Tauraco que conecta trabajo humano con equipos y agentes de IA.", heading: "Sin puestos abiertos actualmente", body: "No publicamos ofertas de empleo. Puedes presentarte al equipo o crear un perfil para encontrar misiones en la plataforma. Las misiones son independientes de un empleo en Tauraco.", contact: "Preséntate", work: "Encontrar una misión" },
  zh: { eyebrow: "招聘", title: "构建实用的", accent: "人机协作流程。", intro: "TaskMatch 是 Tauraco 的产品，将人工工作与团队及 AI 智能体相连接。", heading: "目前没有招聘职位", body: "目前没有公开招聘岗位。你可以向团队介绍自己，或创建工作人员资料来寻找平台任务。平台任务与 Tauraco 的雇佣职位不同。", contact: "介绍自己", work: "寻找任务" },
  pt: {
    eyebrow: "Carreiras",
    title: "Crie fluxos de trabalho úteis",
    accent: "entre pessoas e agentes.",
    intro: "O TaskMatch é um produto da Tauraco que liga o trabalho humano a equipes e agentes de IA.",
    heading: "Sem vagas abertas no momento",
    body: "Não temos vagas de emprego anunciadas. Pode apresentar-se à equipe ou criar um perfil profissional para encontrar missões na plataforma. As missões são independentes de um emprego na Tauraco.",
    contact: "Apresente-se",
    work: "Encontrar uma missão"
  },
};
export default function CareersPage() { const { locale } = useTranslation(); const c = COPY[locale]; return <><PageHero eyebrow={c.eyebrow} title={c.title} accent={c.accent} description={c.intro} /><section className="mx-auto max-w-3xl px-4 py-16 sm:px-6"><h2 className="font-display text-3xl font-semibold">{c.heading}</h2><p className="mt-5 text-base leading-8 text-ink-300">{c.body}</p><div className="mt-7 flex flex-wrap gap-6 text-sm font-medium text-signal-600 underline underline-offset-4"><a href="mailto:hello@tauraco.ai">{c.contact}</a><Link href="/register?intent=work">{c.work}</Link></div></section></>; }
