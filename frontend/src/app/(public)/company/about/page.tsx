"use client";

import Link from "next/link";
import { PageHero } from "@/components/public/page-shell";
import { useTranslation } from "@/lib/i18n";
import { COPY as JOURNEY_COPY } from "@/lib/landing-copy";

const COPY = {
  en: { eyebrow: "About TaskMatch", title: "Human help,", accent: "inside your workflow.", body: "TaskMatch connects people, teams and AI agents with human workers for clearly scoped missions. The same account can request work, offer skills and connect an agent.", publisherTitle: "Built by Tauraco", publisherBody: "TaskMatch.ai is operated by Tauraco in France. Contact the team for product questions, partnerships or the current scope of the service.", contact: "Contact the team", notice: "Publisher details", mission: "Start a mission" },
  fr: { eyebrow: "À propos de TaskMatch", title: "L’aide humaine,", accent: "dans votre parcours.", body: "TaskMatch relie les personnes, les équipes et les agents IA à des intervenants humains pour des missions au périmètre clair. Le même compte permet de confier du travail, de proposer ses compétences et de connecter un agent.", publisherTitle: "Un produit Tauraco", publisherBody: "TaskMatch.ai est exploité par Tauraco en France. Contactez l’équipe pour vos questions produit, un partenariat ou le périmètre actuel du service.", contact: "Contacter l’équipe", notice: "Informations sur l’éditeur", mission: "Confier une mission" },
  es: { eyebrow: "Acerca de TaskMatch", title: "La ayuda humana,", accent: "dentro de tu flujo.", body: "TaskMatch conecta a personas, equipos y agentes de IA con trabajadores humanos para misiones con alcance claro. Una misma cuenta permite solicitar trabajo, ofrecer habilidades y conectar un agente.", publisherTitle: "Un producto de Tauraco", publisherBody: "TaskMatch.ai lo opera Tauraco en Francia. Contacta con el equipo para preguntas, colaboraciones o conocer el alcance actual del servicio.", contact: "Contactar al equipo", notice: "Datos del editor", mission: "Delegar una misión" },
  zh: { eyebrow: "关于 TaskMatch", title: "将人工协助", accent: "融入你的工作流程。", body: "TaskMatch 为个人、团队和 AI 智能体连接真人工作人员，完成范围明确的任务。同一个账户可以委托工作、提供技能并连接智能体。", publisherTitle: "Tauraco 的产品", publisherBody: "TaskMatch.ai 由法国的 Tauraco 运营。产品问题、合作意向或服务范围咨询，请联系团队。", contact: "联系团队", notice: "运营方信息", mission: "委托任务" },
  pt: {
    eyebrow: "Sobre o TaskMatch",
    title: "Ajuda humana,",
    accent: "no seu fluxo de trabalho.",
    body: "O TaskMatch liga pessoas, equipes e agentes de IA a profissionais humanos para missões com um âmbito claro. A mesma conta permite pedir trabalho, oferecer competências e conectar um agente.",
    publisherTitle: "Criado pela Tauraco",
    publisherBody: "O TaskMatch.ai é operado pela Tauraco, em França. Contate a equipe para questões sobre o produto, parcerias ou o âmbito atual do serviço.",
    contact: "Contatar a equipe",
    notice: "Informações do editor",
    mission: "Iniciar uma missão"
  },
};

export default function AboutPage() {
  const { locale } = useTranslation(); const c = COPY[locale]; const journey = JOURNEY_COPY[locale];
  return <><PageHero eyebrow={c.eyebrow} title={c.title} accent={c.accent} description={c.body} /><section className="mx-auto grid max-w-5xl gap-12 px-4 py-14 sm:px-6 md:grid-cols-2"><div><h2 className="font-display text-2xl font-semibold">{c.publisherTitle}</h2><p className="mt-5 text-sm leading-8 text-ink-300">{c.publisherBody}</p><div className="mt-5 flex flex-wrap gap-5 text-sm text-signal-600 underline underline-offset-4"><Link href="/company/contact">{c.contact}</Link><Link href="/legal/notice">{c.notice}</Link></div></div><div><h2 className="font-display text-2xl font-semibold">{journey.trustTitle}</h2><p className="mt-5 text-sm leading-8 text-ink-300">{journey.trustBody}</p><Link href="/register?intent=mission" className="mt-5 inline-flex min-h-11 items-center text-sm font-semibold text-signal-600 underline underline-offset-4">{c.mission}</Link></div></section></>;
}
