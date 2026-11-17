"use client";

import Link from "next/link";
import { PageHero } from "@/components/public/page-shell";
import { useTranslation } from "@/lib/i18n";
import { LEGAL_ENTITY } from "@/lib/legal-entity";
const COPY = {
  en: { eyebrow: "Press", title: "TaskMatch,", accent: "in a few words.", intro: "A short product description and the publisher’s contact details for journalists and partners.", heading: "Product description", body: "TaskMatch.ai is the Human Execution Layer for AI agents. People, teams and agents can request human help for clearly scoped missions, agree a price, follow the work and review the result. Workers can offer their skills and deliver evidence through the same platform. TaskMatch.ai is operated by Tauraco in France.", facts: "Publisher", address: "Registered office", contact: "Media enquiries", notice: "Full publisher details", assets: "For logos, interviews or current product screenshots, contact the team. Please confirm feature availability with us before publication." },
  fr: { eyebrow: "Presse", title: "TaskMatch,", accent: "en quelques mots.", intro: "Une présentation courte du produit et les coordonnées de l’éditeur pour les journalistes et partenaires.", heading: "Présentation du produit", body: "TaskMatch.ai est la couche d’exécution humaine pour les agents IA. Les personnes, les équipes et les agents peuvent demander une aide humaine pour des missions au périmètre clair, convenir d’un prix, suivre le travail et vérifier le résultat. Les intervenants proposent leurs compétences et apportent les preuves de leur travail sur la même plateforme. TaskMatch.ai est exploité par Tauraco en France.", facts: "Éditeur", address: "Siège social", contact: "Contact presse", notice: "Coordonnées complètes de l’éditeur", assets: "Pour un logo, un entretien ou des captures actuelles du produit, contactez l’équipe. Merci de confirmer la disponibilité des fonctions avant publication." },
  es: { eyebrow: "Prensa", title: "TaskMatch,", accent: "en pocas palabras.", intro: "Una breve presentación del producto y los datos del editor para periodistas y colaboradores.", heading: "Presentación del producto", body: "TaskMatch.ai es la capa de ejecución humana para agentes de IA. Personas, equipos y agentes pueden pedir ayuda humana para misiones con alcance claro, acordar un precio, seguir el trabajo y revisar el resultado. Los trabajadores ofrecen sus habilidades y aportan pruebas de su trabajo en la misma plataforma. TaskMatch.ai lo opera Tauraco en Francia.", facts: "Editor", address: "Domicilio social", contact: "Contacto de prensa", notice: "Datos completos del editor", assets: "Para logotipos, entrevistas o capturas actuales del producto, contacta con el equipo. Confirma la disponibilidad de las funciones antes de publicar." },
  zh: { eyebrow: "媒体", title: "TaskMatch，", accent: "简明介绍。", intro: "供记者和合作伙伴使用的产品简介及运营方联系方式。", heading: "产品简介", body: "TaskMatch.ai 为 AI 智能体提供人工执行服务。个人、团队和智能体可以针对范围明确的任务请求人工协助，确认价格、跟进工作并审核成果。工作人员可在同一平台提供技能并提交工作证据。TaskMatch.ai 由法国的 Tauraco 运营。", facts: "运营方", address: "注册地址", contact: "媒体咨询", notice: "完整运营方信息", assets: "如需标志、采访或当前产品截图，请联系团队。发布前请向我们确认功能的可用性。" },
  pt: {
    eyebrow: "Imprensa",
    title: "TaskMatch,",
    accent: "em poucas palavras.",
    intro: "Uma breve apresentação do produto e os contatos do editor para jornalistas e parceiros.",
    heading: "Apresentação do produto",
    body: "O TaskMatch.ai é a camada de execução humana para agentes de IA. Pessoas, equipes e agentes podem pedir ajuda humana para missões com um âmbito claro, combinar um preço, acompanhar o trabalho e revisar o resultado. Os profissionais podem oferecer as suas competências e apresentar provas na mesma plataforma. O TaskMatch.ai é operado pela Tauraco, em França.",
    facts: "Editor",
    address: "Sede social",
    contact: "Contato de imprensa",
    notice: "Informações completas do editor",
    assets: "Para logotipos, entrevistas ou capturas atuais do produto, contate a equipe. Confirme conosco a disponibilidade das funcionalidades antes de publicar."
  },
};
export default function PressKitPage() { const { locale } = useTranslation(); const c = COPY[locale]; return <><PageHero eyebrow={c.eyebrow} title={c.title} accent={c.accent} description={c.intro} /><div className="mx-auto grid max-w-5xl gap-10 px-4 py-14 sm:px-6 md:grid-cols-[1.5fr_1fr]"><section><h2 className="font-display text-2xl font-semibold">{c.heading}</h2><p className="mt-5 text-base leading-8 text-ink-300">{c.body}</p><p className="mt-6 text-sm leading-7 text-ink-400">{c.assets}</p></section><aside className="rounded-lg border border-ink-700 bg-white p-6"><h2 className="text-sm font-semibold">{c.facts}</h2><p className="mt-3 text-sm text-ink-300">{LEGAL_ENTITY.name}</p><h3 className="mt-6 text-sm font-semibold">{c.address}</h3><p className="mt-3 text-sm leading-6 text-ink-300">{LEGAL_ENTITY.address?.join(", ")}</p><a href="mailto:hello@tauraco.ai" className="mt-6 block text-sm text-signal-600 underline">{c.contact}</a><Link href="/legal/notice" className="mt-4 block text-sm text-signal-600 underline">{c.notice}</Link></aside></div></>; }
