"use client";

import { useState } from "react";
import Link from "next/link";
import { ArrowRight, Layers, Menu, X } from "lucide-react";
import { LanguageSwitcher } from "@/components/language-switcher";
import { useAuth } from "@/lib/auth";
import { useTranslation } from "@/lib/i18n";
import { COPY } from "@/lib/landing-copy";
import { authIntentHref, postAuthDestination, MARKETPLACE_INTENTS } from "@/lib/public-intent";
import { cn } from "@/lib/utils";

const LABELS = {
  en: { signIn: "Sign in", resources: "Resources", legal: "Legal", contact: "Contact", docs: "Documentation", guides: "Guides", privacy: "Privacy", terms: "Terms", notice: "Legal notice", security: "Security", about: "About", rights: "All rights reserved." },
  fr: { signIn: "Se connecter", resources: "Ressources", legal: "Informations légales", contact: "Contact", docs: "Documentation", guides: "Guides", privacy: "Confidentialité", terms: "Conditions", notice: "Mentions légales", security: "Sécurité", about: "À propos", rights: "Tous droits réservés." },
  es: { signIn: "Iniciar sesión", resources: "Recursos", legal: "Información legal", contact: "Contacto", docs: "Documentación", guides: "Guías", privacy: "Privacidad", terms: "Condiciones", notice: "Aviso legal", security: "Seguridad", about: "Acerca de", rights: "Todos los derechos reservados." },
  zh: { signIn: "登录", resources: "资源", legal: "法律信息", contact: "联系", docs: "文档", guides: "指南", privacy: "隐私", terms: "条款", notice: "法律声明", security: "安全", about: "关于", rights: "版权所有。" },
  pt: {
    signIn: "Entrar",
    resources: "Recursos",
    legal: "Informações legais",
    contact: "Contato",
    docs: "Documentação",
    guides: "Guias",
    privacy: "Privacidade",
    terms: "Termos",
    notice: "Aviso legal",
    security: "Segurança",
    about: "Sobre",
    rights: "Todos os direitos reservados."
  },
};

export function SiteLogo({ className = "" }: { className?: string }) {
  return <Link href="/" className={cn("group flex shrink-0 items-center gap-2.5", className)}><span className="flex h-7 w-7 items-center justify-center rounded-lg bg-signal-500"><Layers aria-hidden="true" className="h-4 w-4 text-ink-950" /></span><span className="text-sm font-bold tracking-tight text-ink-50">TaskMatch<span className="text-signal-600">.ai</span></span></Link>;
}

export function PublicNavbar() {
  const { isAuthenticated, user } = useAuth();
  const [mobileOpen, setMobileOpen] = useState(false);
  const { locale, t } = useTranslation();
  const c = COPY[locale];
  const L = LABELS[locale];
  const paths = MARKETPLACE_INTENTS.map(intent => ({ intent, label: c[intent] }));
  return <header className="fixed top-0 z-50 w-full border-b border-ink-800 bg-ink-950/92 backdrop-blur-xl">
    <div className="mx-auto flex min-h-16 max-w-7xl items-center justify-between gap-5 px-4 sm:px-6 lg:px-8">
      <SiteLogo />
      <nav className="hidden items-center gap-5 lg:flex">{paths.map(path => <Link key={path.intent} href={isAuthenticated && user ? postAuthDestination(user.role, path.intent) : authIntentHref("register", path.intent)} className="py-3 text-sm font-medium text-ink-300 transition-colors hover:text-signal-600">{path.label}</Link>)}</nav>
      <div className="hidden items-center gap-5 lg:flex"><LanguageSwitcher /><Link href="/login" className="inline-flex min-h-10 items-center gap-2 text-sm font-semibold text-ink-200">{L.signIn}<ArrowRight className="h-4 w-4" /></Link></div>
      <button type="button" className="inline-flex h-11 w-11 items-center justify-center rounded-lg border border-ink-700 lg:hidden" onClick={() => setMobileOpen(!mobileOpen)} aria-label={t("publicUi.toggleMenu")} aria-expanded={mobileOpen} aria-controls="public-mobile-nav">{mobileOpen ? <X aria-hidden="true" className="h-5 w-5" /> : <Menu aria-hidden="true" className="h-5 w-5" />}</button>
    </div>
    {mobileOpen && <div id="public-mobile-nav" className="border-t border-ink-800 bg-white px-4 pb-5 pt-2 lg:hidden"><nav className="flex flex-col">{paths.map(path => <Link key={path.intent} href={isAuthenticated && user ? postAuthDestination(user.role, path.intent) : authIntentHref("register", path.intent)} onClick={() => setMobileOpen(false)} className="border-b border-ink-800 py-4 text-sm font-medium">{path.label}</Link>)}</nav><div className="mt-4 flex items-center justify-between"><LanguageSwitcher /><Link href="/login" onClick={() => setMobileOpen(false)} className="px-2 py-3 text-sm font-semibold">{L.signIn}</Link></div></div>}
  </header>;
}

export function PublicFooter() {
  const { locale, t } = useTranslation();
  const c = COPY[locale]; const L = LABELS[locale];
  const columns = [
    { title: "TaskMatch", links: [{ label: c.learn, href: "/how-it-works" }, { label: c.pricing, href: "/pricing" }, { label: L.about, href: "/company/about" }, { label: L.contact, href: "/company/contact" }] },
    { title: L.resources, links: [{ label: L.docs, href: "/resources/documentation" }, { label: "API", href: "/resources/api-reference" }, { label: "SDK", href: "/resources/sdk" }, { label: L.guides, href: "/resources/guides" }] },
    { title: L.legal, links: [{ label: L.notice, href: "/legal/notice" }, { label: L.privacy, href: "/legal/privacy" }, { label: L.terms, href: "/legal/terms" }, { label: L.security, href: "/legal/security" }] },
  ];
  return <footer className="border-t border-ink-800 bg-ink-950"><div className="mx-auto max-w-6xl px-4 py-12 sm:px-6 lg:px-8"><div className="grid gap-9 sm:grid-cols-[1.2fr_1fr_1fr_1fr]"><div><SiteLogo /><p className="mt-5 max-w-48 text-xs leading-6 text-ink-400">{c.eyebrow}</p></div>{columns.map(column => <div key={column.title}><h2 className="text-sm font-semibold text-ink-200">{column.title}</h2><ul className="mt-4 space-y-3">{column.links.map(link => <li key={link.href}><Link href={link.href} className="text-sm text-ink-400 hover:text-ink-50">{link.label}</Link></li>)}</ul></div>)}</div><p className="mt-10 border-t border-ink-800 pt-6 text-xs leading-6 text-ink-400">© {new Date().getFullYear()} {t("publicUi.operatedBy")} {L.rights}</p></div></footer>;
}
