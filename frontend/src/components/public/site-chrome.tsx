"use client";

import React, { useState } from "react";
import Link from "next/link";
import { usePathname } from "next/navigation";
import { LanguageSwitcher } from "@/components/language-switcher";
import { useTranslation, type Locale } from "@/lib/i18n";
import { cn } from "@/lib/utils";
import {
  ArrowRight,
  BookOpen,
  Building2,
  ChevronDown,
  FileText,
  HelpCircle,
  History,
  Layers,
  Lock,
  Menu,
  Scale,
  Shield,
  Users,
  X,
} from "lucide-react";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";

/* ------------------------------------------------------------------ */
/*  Nav/footer labels — translated in all 4 languages                 */
/* ------------------------------------------------------------------ */
type NavLabels = {
  resources: string; company: string; legal: string; pricing: string;
  signIn: string; startTask: string;
  howItWorks: string; howItWorksDesc: string;
  changelog: string; changelogDesc: string;
  docs: string; docsDesc: string;
  faq: string; faqDesc: string;
  forClients: string; forClientsDesc: string;
  forDevelopers: string; forDevsDesc: string;
  privacy: string; privacyDesc: string;
  terms: string; termsDesc: string;
  security: string; securityDesc: string;
  fProduct: string; fSolutions: string; fCompany: string; fLegal: string;
  enterprise: string; agentSDK: string; about: string; careers: string;
  contact: string; blog: string; compliance: string; rights: string;
};

const LABELS: Record<Locale, NavLabels> = {
  en: {
    resources: "Resources", company: "Company", legal: "Legal", pricing: "Pricing",
    signIn: "Sign In", startTask: "Post a task",
    howItWorks: "How It Works", howItWorksDesc: "See the four-step execution flow",
    changelog: "Changelog", changelogDesc: "Recent product updates",
    docs: "Documentation", docsDesc: "Technical docs and references",
    faq: "FAQ", faqDesc: "Common questions answered",
    forClients: "For Clients", forClientsDesc: "For teams that need structured execution",
    forDevelopers: "For Developers", forDevsDesc: "For builders delivering agent-powered work",
    privacy: "Privacy Policy", privacyDesc: "How data is handled and protected",
    terms: "Terms of Service", termsDesc: "Commercial and platform terms",
    security: "Security", securityDesc: "Security posture and controls",
    fProduct: "Product", fSolutions: "Solutions", fCompany: "Company", fLegal: "Legal",
    enterprise: "Enterprise", agentSDK: "Agent SDK", about: "About", careers: "Careers",
    contact: "Contact", blog: "Blog", compliance: "Compliance", rights: "All rights reserved.",
  },
  fr: {
    resources: "Ressources", company: "Entreprise", legal: "Légal", pricing: "Tarifs",
    signIn: "Se connecter", startTask: "Publier une tâche",
    howItWorks: "Fonctionnement", howItWorksDesc: "Le flux d’exécution en quatre étapes",
    changelog: "Nouveautés", changelogDesc: "Dernières mises à jour produit",
    docs: "Documentation", docsDesc: "Docs techniques et références",
    faq: "FAQ", faqDesc: "Questions fréquentes",
    forClients: "Pour les clients", forClientsDesc: "Pour les équipes qui veulent une exécution structurée",
    forDevelopers: "Pour les développeurs", forDevsDesc: "Pour les créateurs qui livrent via des agents",
    privacy: "Confidentialité", privacyDesc: "Traitement et protection des données",
    terms: "Conditions d’utilisation", termsDesc: "Conditions commerciales et de la plateforme",
    security: "Sécurité", securityDesc: "Posture et contrôles de sécurité",
    fProduct: "Produit", fSolutions: "Solutions", fCompany: "Entreprise", fLegal: "Légal",
    enterprise: "Entreprise", agentSDK: "SDK Agent", about: "À propos", careers: "Carrières",
    contact: "Contact", blog: "Blog", compliance: "Conformité", rights: "Tous droits réservés.",
  },
  es: {
    resources: "Recursos", company: "Empresa", legal: "Legal", pricing: "Precios",
    signIn: "Iniciar sesión", startTask: "Publicar una tarea",
    howItWorks: "Cómo funciona", howItWorksDesc: "El flujo de ejecución en cuatro pasos",
    changelog: "Novedades", changelogDesc: "Últimas actualizaciones del producto",
    docs: "Documentación", docsDesc: "Documentación técnica y referencias",
    faq: "Preguntas", faqDesc: "Preguntas frecuentes",
    forClients: "Para clientes", forClientsDesc: "Para equipos que necesitan ejecución estructurada",
    forDevelopers: "Para desarrolladores", forDevsDesc: "Para quienes entregan trabajo con agentes",
    privacy: "Privacidad", privacyDesc: "Cómo se tratan y protegen los datos",
    terms: "Términos del servicio", termsDesc: "Términos comerciales y de la plataforma",
    security: "Seguridad", securityDesc: "Postura y controles de seguridad",
    fProduct: "Producto", fSolutions: "Soluciones", fCompany: "Empresa", fLegal: "Legal",
    enterprise: "Empresas", agentSDK: "SDK de agentes", about: "Acerca de", careers: "Empleo",
    contact: "Contacto", blog: "Blog", compliance: "Cumplimiento", rights: "Todos los derechos reservados.",
  },
  zh: {
    resources: "资源", company: "公司", legal: "法律", pricing: "定价",
    signIn: "登录", startTask: "发布任务",
    howItWorks: "运作方式", howItWorksDesc: "查看四步执行流程",
    changelog: "更新日志", changelogDesc: "近期产品更新",
    docs: "文档", docsDesc: "技术文档与参考",
    faq: "常见问题", faqDesc: "常见问题解答",
    forClients: "面向客户", forClientsDesc: "为需要结构化执行的团队",
    forDevelopers: "面向开发者", forDevsDesc: "为通过智能体交付工作的开发者",
    privacy: "隐私政策", privacyDesc: "数据的处理与保护方式",
    terms: "服务条款", termsDesc: "商业与平台条款",
    security: "安全", securityDesc: "安全态势与控制",
    fProduct: "产品", fSolutions: "解决方案", fCompany: "公司", fLegal: "法律",
    enterprise: "企业版", agentSDK: "智能体 SDK", about: "关于", careers: "招聘",
    contact: "联系我们", blog: "博客", compliance: "合规", rights: "版权所有。",
  },
};

export function SiteLogo({ className = "" }: { className?: string }) {
  return (
    <Link href="/" className={cn("flex items-center gap-2.5", className)}>
      <span className="flex h-8 w-8 items-center justify-center rounded-lg bg-brand-800">
        <Layers className="h-4 w-4 text-white" />
      </span>
      <span className="text-sm font-semibold tracking-tight text-stone-900">
        TaskMatch<span className="text-brand-700">.ai</span>
      </span>
    </Link>
  );
}

interface NavDropdownItem { label: string; href: string; icon: React.ElementType; description: string; }
interface NavDropdownGroup { label: string; items: NavDropdownItem[]; }

function NavDropdown({ group }: { group: NavDropdownGroup }) {
  return (
    <DropdownMenu>
      <DropdownMenuTrigger className="flex items-center gap-1 text-sm font-medium text-stone-600 transition-colors hover:text-stone-900 focus:outline-none">
        {group.label}
        <ChevronDown className="h-3.5 w-3.5" />
      </DropdownMenuTrigger>
      <DropdownMenuContent
        align="start"
        className="w-80 rounded-xl border-stone-200 bg-white p-2 text-stone-900 shadow-lg"
      >
        {group.items.map((item) => {
          const Icon = item.icon;
          return (
            <Link key={item.href} href={item.href}>
              <DropdownMenuItem className="flex items-start gap-3 rounded-lg p-3 focus:bg-stone-50">
                <div className="mt-0.5 flex h-9 w-9 shrink-0 items-center justify-center rounded-lg border border-stone-200 bg-stone-50 text-brand-700">
                  <Icon className="h-4 w-4" />
                </div>
                <div>
                  <div className="text-sm font-medium text-stone-900">{item.label}</div>
                  <div className="text-xs leading-5 text-stone-500">{item.description}</div>
                </div>
              </DropdownMenuItem>
            </Link>
          );
        })}
      </DropdownMenuContent>
    </DropdownMenu>
  );
}

export function PublicNavbar() {
  const [mobileOpen, setMobileOpen] = useState(false);
  const pathname = usePathname();
  const { locale } = useTranslation();
  const L = LABELS[locale] ?? LABELS.en;

  const resources: NavDropdownGroup = {
    label: L.resources,
    items: [
      { label: L.howItWorks, href: "/how-it-works", icon: BookOpen, description: L.howItWorksDesc },
      { label: L.changelog, href: "/changelog", icon: History, description: L.changelogDesc },
      { label: L.docs, href: "/resources/documentation", icon: FileText, description: L.docsDesc },
      { label: L.faq, href: "/pricing#faq", icon: HelpCircle, description: L.faqDesc },
    ],
  };
  const company: NavDropdownGroup = {
    label: L.company,
    items: [
      { label: L.forClients, href: "/for-clients", icon: Building2, description: L.forClientsDesc },
      { label: L.forDevelopers, href: "/for-developers", icon: Users, description: L.forDevsDesc },
    ],
  };
  const legal: NavDropdownGroup = {
    label: L.legal,
    items: [
      { label: L.privacy, href: "/legal/privacy", icon: Shield, description: L.privacyDesc },
      { label: L.terms, href: "/legal/terms", icon: Scale, description: L.termsDesc },
      { label: L.security, href: "/legal/security", icon: Lock, description: L.securityDesc },
    ],
  };

  return (
    <header className="fixed top-0 z-50 w-full border-b border-stone-200 bg-white/90 backdrop-blur-md">
      <div className="mx-auto flex h-16 max-w-7xl items-center justify-between px-4 sm:px-6 lg:px-8">
        <SiteLogo />

        <nav className="hidden items-center gap-6 lg:flex">
          <NavDropdown group={resources} />
          <NavDropdown group={company} />
          <NavDropdown group={legal} />
          <Link
            href="/pricing"
            className={cn(
              "text-sm font-medium transition-colors hover:text-stone-900",
              pathname === "/pricing" ? "text-stone-900" : "text-stone-600"
            )}
          >
            {L.pricing}
          </Link>
        </nav>

        <div className="hidden items-center gap-4 lg:flex">
          <LanguageSwitcher />
          <Link href="/login" className="text-sm font-medium text-stone-600 transition-colors hover:text-stone-900">
            {L.signIn}
          </Link>
          <Link
            href="/register"
            className="inline-flex h-9 items-center gap-1.5 rounded-lg bg-brand-800 px-4 text-sm font-semibold text-white transition-colors hover:bg-brand-900"
          >
            {L.startTask}
            <ArrowRight className="h-3.5 w-3.5" />
          </Link>
        </div>

        <button
          className="inline-flex h-10 w-10 items-center justify-center rounded-lg border border-stone-300 text-stone-700 lg:hidden"
          onClick={() => setMobileOpen((open) => !open)}
          aria-label="Toggle menu"
        >
          {mobileOpen ? <X className="h-5 w-5" /> : <Menu className="h-5 w-5" />}
        </button>
      </div>

      {mobileOpen && (
        <div className="border-t border-stone-200 bg-white px-4 py-4 lg:hidden">
          <div className="space-y-4">
            {[resources, company, legal].map((group) => (
              <div key={group.label}>
                <div className="eyebrow mb-2 px-2 text-stone-400">{group.label}</div>
                <div className="space-y-1">
                  {group.items.map((item) => {
                    const Icon = item.icon;
                    return (
                      <Link
                        key={item.href}
                        href={item.href}
                        onClick={() => setMobileOpen(false)}
                        className="flex items-center gap-3 rounded-lg px-3 py-3 text-sm font-medium text-stone-600 hover:bg-stone-50 hover:text-stone-900"
                      >
                        <Icon className="h-4 w-4 text-stone-400" />
                        {item.label}
                      </Link>
                    );
                  })}
                </div>
              </div>
            ))}
            <Link
              href="/pricing"
              onClick={() => setMobileOpen(false)}
              className="block rounded-lg px-3 py-3 text-sm font-medium text-stone-600 hover:bg-stone-50 hover:text-stone-900"
            >
              {L.pricing}
            </Link>
          </div>
          <div className="mt-4 flex items-center gap-3 border-t border-stone-200 pt-4">
            <LanguageSwitcher />
            <Link href="/login" className="flex-1">
              <span className="flex h-9 w-full items-center justify-center rounded-lg border border-stone-300 text-sm font-medium text-stone-900">
                {L.signIn}
              </span>
            </Link>
            <Link href="/register" className="flex-1">
              <span className="flex h-9 w-full items-center justify-center rounded-lg bg-brand-800 text-sm font-semibold text-white">
                {L.startTask}
              </span>
            </Link>
          </div>
        </div>
      )}
    </header>
  );
}

export function PublicFooter() {
  const { locale } = useTranslation();
  const L = LABELS[locale] ?? LABELS.en;
  const year = new Date().getFullYear();

  const columns = [
    { title: L.fProduct, links: [
      { label: L.howItWorks, href: "/how-it-works" },
      { label: L.pricing, href: "/pricing" },
      { label: L.changelog, href: "/changelog" },
      { label: L.docs, href: "/resources/documentation" },
    ]},
    { title: L.fSolutions, links: [
      { label: L.forClients, href: "/for-clients" },
      { label: L.forDevelopers, href: "/for-developers" },
      { label: L.enterprise, href: "/pricing#enterprise" },
      { label: L.agentSDK, href: "/resources/sdk" },
    ]},
    { title: L.fCompany, links: [
      { label: L.about, href: "/company/about" },
      { label: L.careers, href: "/company/careers" },
      { label: L.contact, href: "/company/contact" },
      { label: L.blog, href: "/resources/blog" },
    ]},
    { title: L.fLegal, links: [
      { label: L.privacy, href: "/legal/privacy" },
      { label: L.terms, href: "/legal/terms" },
      { label: L.security, href: "/legal/security" },
      { label: L.compliance, href: "/legal/compliance" },
    ]},
  ];

  return (
    <footer className="border-t border-stone-200 bg-stone-50">
      <div className="mx-auto max-w-7xl px-4 py-14 sm:px-6 lg:px-8">
        <div className="grid grid-cols-2 gap-8 md:grid-cols-4 lg:gap-12">
          {columns.map((column) => (
            <div key={column.title}>
              <h4 className="eyebrow mb-4 text-stone-500">{column.title}</h4>
              <ul className="space-y-3">
                {column.links.map((link) => (
                  <li key={link.href}>
                    <Link href={link.href} className="text-sm text-stone-600 transition-colors hover:text-stone-900">
                      {link.label}
                    </Link>
                  </li>
                ))}
              </ul>
            </div>
          ))}
        </div>

        <div className="mt-12 flex flex-col gap-4 border-t border-stone-200 pt-6 md:flex-row md:items-center md:justify-between">
          <SiteLogo />
          <div className="flex flex-col gap-2 md:flex-row md:items-center md:gap-4">
            <a
              href="https://www.linkedin.com/company/tauraco"
              target="_blank"
              rel="noopener noreferrer"
              className="text-xs text-stone-500 transition-colors hover:text-brand-700"
            >
              LinkedIn ↗
            </a>
            <p className="text-xs text-stone-500">© {year} TaskMatch.ai — operated by Tauraco. {L.rights}</p>
          </div>
        </div>
      </div>
    </footer>
  );
}
