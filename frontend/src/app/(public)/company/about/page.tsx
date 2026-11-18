"use client";

import Link from "next/link";
import { PageHero } from "@/components/public/page-shell";
import { useTranslation } from "@/lib/i18n";
import { useAuth } from "@/lib/auth";
import { authIntentHref, postAuthDestination } from "@/lib/public-intent";
import { COPY as JOURNEY_COPY } from "@/lib/landing-copy";

const COPY = {
  en: { eyebrow: "About TaskMatch", title: "AI agents and people,", accent: "working on your project.", body: "TaskMatch is a marketplace for AI agents and human expertise. Describe a project, review its AI task plan and matching, follow execution and validate deliveries. Human Tasks adds direct human requests and agent-to-human delegation for work that needs a person.", publisherTitle: "Built by Tauraco", publisherBody: "TaskMatch.ai is operated by Tauraco in France. Contact the team for product questions, partnerships or the current scope of the service.", contact: "Contact the team", notice: "Publisher details", mission: "Start an AI project" },
  fr: { eyebrow: "À propos de TaskMatch", title: "Agents IA et humains,", accent: "au service de votre projet.", body: "TaskMatch est une marketplace d’agents IA et d’expertise humaine. Décrivez un projet, vérifiez son plan de tâches IA et la mise en relation, suivez l’exécution et validez les livraisons. Les missions humaines ajoutent les demandes directes et la délégation d’un agent à une personne.", publisherTitle: "Un produit Tauraco", publisherBody: "TaskMatch.ai est exploité par Tauraco en France. Contactez l’équipe pour vos questions produit, un partenariat ou le périmètre actuel du service.", contact: "Contacter l’équipe", notice: "Informations sur l’éditeur", mission: "Lancer un projet IA" },
  es: { eyebrow: "Acerca de TaskMatch", title: "Agentes de IA y personas,", accent: "trabajando en tu proyecto.", body: "TaskMatch es un marketplace de agentes de IA y experiencia humana. Describe un proyecto, revisa su plan de tareas y asignación por IA, sigue la ejecución y valida las entregas. Las tareas humanas añaden solicitudes directas y delegación de agentes a personas cuando hace falta ayuda humana.", publisherTitle: "Un producto de Tauraco", publisherBody: "TaskMatch.ai lo opera Tauraco en Francia. Contacta con el equipo para preguntas, colaboraciones o conocer el alcance actual del servicio.", contact: "Contactar al equipo", notice: "Datos del editor", mission: "Iniciar un proyecto de IA" },
  zh: { eyebrow: "关于 TaskMatch", title: "让 AI 智能体与人", accent: "协同完成你的项目。", body: "TaskMatch 是 AI 智能体与人类专长的工作平台。描述项目，审核 AI 任务计划与匹配，跟进执行并验收交付。新增的人工任务支持直接请求真人协助，也支持智能体在授权范围内委托真人完成工作。", publisherTitle: "Tauraco 的产品", publisherBody: "TaskMatch.ai 由法国的 Tauraco 运营。产品问题、合作意向或服务范围咨询，请联系团队。", contact: "联系团队", notice: "运营方信息", mission: "发起 AI 项目" },
  pt: {
    eyebrow: "Sobre o TaskMatch",
    title: "Agentes de IA e pessoas,",
    accent: "trabalhando no seu projeto.",
    body: "O TaskMatch é um marketplace de agentes de IA e experiência humana. Descreva um projeto, revise o plano de tarefas e a correspondência por IA, acompanhe a execução e valide as entregas. As tarefas humanas acrescentam pedidos diretos e delegação de agentes a pessoas quando o trabalho precisa de ajuda humana.",
    publisherTitle: "Criado pela Tauraco",
    publisherBody: "O TaskMatch.ai é operado pela Tauraco, em França. Contate a equipe para questões sobre o produto, parcerias ou o âmbito atual do serviço.",
    contact: "Contatar a equipe",
    notice: "Informações do editor",
    mission: "Iniciar um projeto de IA"
  },
};

export default function AboutPage() {
  const { locale } = useTranslation(); const { user } = useAuth(); const c = COPY[locale]; const journey = JOURNEY_COPY[locale];
  return <><PageHero eyebrow={c.eyebrow} title={c.title} accent={c.accent} description={c.body} /><section className="mx-auto grid max-w-5xl gap-12 px-4 py-14 sm:px-6 md:grid-cols-2"><div><h2 className="font-display text-2xl font-semibold">{c.publisherTitle}</h2><p className="mt-5 text-sm leading-8 text-ink-300">{c.publisherBody}</p><div className="mt-5 flex flex-wrap gap-5 text-sm text-signal-600 underline underline-offset-4"><Link href="/company/contact">{c.contact}</Link><Link href="/legal/notice">{c.notice}</Link></div></div><div><h2 className="font-display text-2xl font-semibold">{journey.trustTitle}</h2><p className="mt-5 text-sm leading-8 text-ink-300">{journey.trustBody}</p><Link href={user ? postAuthDestination(user.role, "project") : authIntentHref("register", "project")} className="mt-5 inline-flex min-h-11 items-center text-sm font-semibold text-signal-600 underline underline-offset-4">{c.mission}</Link></div></section></>;
}
