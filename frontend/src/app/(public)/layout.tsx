"use client";

import React, { useState } from "react";
import Link from "next/link";
import { usePathname } from "next/navigation";
import { Button } from "@/components/ui/button";
import { LanguageSwitcher } from "@/components/language-switcher";
import { useTranslation } from "@/lib/i18n";
import { cn } from "@/lib/utils";
import {
  Sparkles,
  Menu,
  X,
  ChevronDown,
  BookOpen,
  FileText,
  HelpCircle,
  History,
  Building2,
  Users,
  Shield,
  Scale,
  Lock,
  ExternalLink,
} from "lucide-react";
import {
  DropdownMenu,
  DropdownMenuTrigger,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuSeparator,
  DropdownMenuLabel,
} from "@/components/ui/dropdown-menu";

/* -------------------------------------------------------------------------- */
/*  Navigation Configuration                                                   */
/* -------------------------------------------------------------------------- */

interface NavDropdownItem {
  label: string;
  href: string;
  icon: React.ElementType;
  description: string;
}

interface NavDropdownGroup {
  label: string;
  items: NavDropdownItem[];
}

function useNavConfig() {
  const { t } = useTranslation();

  const resources: NavDropdownGroup = {
    label: t("nav.resources", "Resources"),
    items: [
      {
        label: t("nav.howItWorks", "How It Works"),
        href: "/how-it-works",
        icon: BookOpen,
        description: t("nav.howItWorksDesc", "Learn about the platform pipeline"),
      },
      {
        label: t("nav.changelog", "Changelog"),
        href: "/changelog",
        icon: History,
        description: t("nav.changelogDesc", "Latest updates and releases"),
      },
      {
        label: t("nav.docs", "Documentation"),
        href: "/how-it-works#architecture",
        icon: FileText,
        description: t("nav.docsDesc", "Technical guides and API reference"),
      },
      {
        label: t("nav.faq", "FAQ"),
        href: "/pricing#faq",
        icon: HelpCircle,
        description: t("nav.faqDesc", "Frequently asked questions"),
      },
    ],
  };

  const company: NavDropdownGroup = {
    label: t("nav.company", "Company"),
    items: [
      {
        label: t("nav.forClients", "For Clients"),
        href: "/for-clients",
        icon: Building2,
        description: t("nav.forClientsDesc", "Automate your business tasks"),
      },
      {
        label: t("nav.forDevelopers", "For Developers"),
        href: "/for-developers",
        icon: Users,
        description: t("nav.forDevsDesc", "Build and monetize AI agents"),
      },
    ],
  };

  const legal: NavDropdownGroup = {
    label: t("nav.legal", "Legal"),
    items: [
      {
        label: t("nav.privacy", "Privacy Policy"),
        href: "/privacy",
        icon: Shield,
        description: t("nav.privacyDesc", "How we protect your data"),
      },
      {
        label: t("nav.terms", "Terms of Service"),
        href: "/terms",
        icon: Scale,
        description: t("nav.termsDesc", "Platform usage terms"),
      },
      {
        label: t("nav.security", "Security"),
        href: "/security",
        icon: Lock,
        description: t("nav.securityDesc", "Enterprise-grade security"),
      },
    ],
  };

  return { resources, company, legal };
}

/* -------------------------------------------------------------------------- */
/*  NavDropdown                                                                */
/* -------------------------------------------------------------------------- */

function NavDropdown({ group }: { group: NavDropdownGroup }) {
  return (
    <DropdownMenu>
      <DropdownMenuTrigger className="flex items-center gap-1 text-sm font-medium text-gray-600 transition-colors hover:text-gray-900">
        {group.label}
        <ChevronDown className="h-3.5 w-3.5" />
      </DropdownMenuTrigger>
      <DropdownMenuContent align="start" className="w-72 p-2">
        {group.items.map((item) => {
          const Icon = item.icon;
          return (
            <Link key={item.href} href={item.href}>
              <DropdownMenuItem className="flex items-start gap-3 rounded-lg p-3">
                <div className="mt-0.5 flex h-8 w-8 shrink-0 items-center justify-center rounded-md bg-indigo-50 text-indigo-600">
                  <Icon className="h-4 w-4" />
                </div>
                <div>
                  <div className="text-sm font-medium text-gray-900">{item.label}</div>
                  <div className="text-xs text-gray-500">{item.description}</div>
                </div>
              </DropdownMenuItem>
            </Link>
          );
        })}
      </DropdownMenuContent>
    </DropdownMenu>
  );
}

/* -------------------------------------------------------------------------- */
/*  Navbar                                                                     */
/* -------------------------------------------------------------------------- */

function PublicNavbar() {
  const [mobileOpen, setMobileOpen] = useState(false);
  const pathname = usePathname();
  const { t } = useTranslation();
  const { resources, company, legal } = useNavConfig();

  const directLinks = [
    { label: t("nav.pricing", "Pricing"), href: "/pricing" },
  ];

  return (
    <header className="fixed top-0 z-50 w-full border-b border-gray-200/60 bg-white/80 backdrop-blur-xl">
      <div className="mx-auto flex h-16 max-w-7xl items-center justify-between px-4 sm:px-6 lg:px-8">
        {/* Logo */}
        <Link href="/" className="flex items-center gap-2">
          <div className="flex h-8 w-8 items-center justify-center rounded-lg bg-gradient-to-br from-blue-600 to-indigo-600">
            <Sparkles className="h-4 w-4 text-white" />
          </div>
          <span className="text-xl font-bold tracking-tight text-gray-900">
            TaskMatch<span className="text-indigo-600">.ai</span>
          </span>
        </Link>

        {/* Desktop Navigation */}
        <nav className="hidden items-center gap-6 lg:flex">
          <NavDropdown group={resources} />
          <NavDropdown group={company} />
          <NavDropdown group={legal} />
          {directLinks.map((link) => (
            <Link
              key={link.href}
              href={link.href}
              className={cn(
                "text-sm font-medium transition-colors hover:text-gray-900",
                pathname === link.href ? "text-indigo-600" : "text-gray-600"
              )}
            >
              {link.label}
            </Link>
          ))}
        </nav>

        {/* Desktop Actions */}
        <div className="hidden items-center gap-3 lg:flex">
          <LanguageSwitcher />
          <Link href="/login">
            <Button variant="ghost" size="sm">
              {t("nav.signIn", "Sign In")}
            </Button>
          </Link>
          <Link href="/register">
            <Button size="sm" className="bg-indigo-600 text-white hover:bg-indigo-700">
              {t("nav.getStarted", "Get Started")}
            </Button>
          </Link>
        </div>

        {/* Mobile Menu Toggle */}
        <button
          className="rounded-md p-2 text-gray-600 hover:bg-gray-100 lg:hidden"
          onClick={() => setMobileOpen(!mobileOpen)}
        >
          {mobileOpen ? <X className="h-5 w-5" /> : <Menu className="h-5 w-5" />}
        </button>
      </div>

      {/* Mobile Menu */}
      {mobileOpen && (
        <div className="border-t border-gray-100 bg-white lg:hidden">
          <div className="mx-auto max-w-7xl space-y-1 px-4 py-4 sm:px-6">
            {[resources, company, legal].map((group) => (
              <div key={group.label} className="py-2">
                <div className="mb-1 px-3 text-xs font-semibold uppercase tracking-wider text-gray-400">
                  {group.label}
                </div>
                {group.items.map((item) => {
                  const Icon = item.icon;
                  return (
                    <Link
                      key={item.href}
                      href={item.href}
                      onClick={() => setMobileOpen(false)}
                      className="flex items-center gap-3 rounded-lg px-3 py-2.5 text-sm font-medium text-gray-700 hover:bg-gray-50"
                    >
                      <Icon className="h-4 w-4 text-gray-400" />
                      {item.label}
                    </Link>
                  );
                })}
              </div>
            ))}
            {directLinks.map((link) => (
              <Link
                key={link.href}
                href={link.href}
                onClick={() => setMobileOpen(false)}
                className="flex items-center rounded-lg px-3 py-2.5 text-sm font-medium text-gray-700 hover:bg-gray-50"
              >
                {link.label}
              </Link>
            ))}
            <div className="flex items-center gap-3 border-t border-gray-100 pt-4">
              <LanguageSwitcher />
              <Link href="/login" className="flex-1">
                <Button variant="outline" size="sm" className="w-full">
                  {t("nav.signIn", "Sign In")}
                </Button>
              </Link>
              <Link href="/register" className="flex-1">
                <Button size="sm" className="w-full bg-indigo-600 text-white hover:bg-indigo-700">
                  {t("nav.getStarted", "Get Started")}
                </Button>
              </Link>
            </div>
          </div>
        </div>
      )}
    </header>
  );
}

/* -------------------------------------------------------------------------- */
/*  Footer                                                                     */
/* -------------------------------------------------------------------------- */

function PublicFooter() {
  const { t } = useTranslation();

  const columns = [
    {
      title: t("footer.product", "Product"),
      links: [
        { label: t("footer.howItWorks", "How It Works"), href: "/how-it-works" },
        { label: t("footer.pricing", "Pricing"), href: "/pricing" },
        { label: t("footer.changelog", "Changelog"), href: "/changelog" },
        { label: t("footer.docs", "Documentation"), href: "/how-it-works#architecture" },
      ],
    },
    {
      title: t("footer.solutions", "Solutions"),
      links: [
        { label: t("footer.forClients", "For Clients"), href: "/for-clients" },
        { label: t("footer.forDevelopers", "For Developers"), href: "/for-developers" },
        { label: t("footer.enterprise", "Enterprise"), href: "/pricing#enterprise" },
        { label: t("footer.agentSDK", "Agent SDK"), href: "/for-developers#sdk" },
      ],
    },
    {
      title: t("footer.company", "Company"),
      links: [
        { label: t("footer.about", "About"), href: "/about" },
        { label: t("footer.blog", "Blog"), href: "/blog" },
        { label: t("footer.careers", "Careers"), href: "/careers" },
        { label: t("footer.contact", "Contact"), href: "/contact" },
      ],
    },
    {
      title: t("footer.legal", "Legal"),
      links: [
        { label: t("footer.privacy", "Privacy Policy"), href: "/privacy" },
        { label: t("footer.terms", "Terms of Service"), href: "/terms" },
        { label: t("footer.security", "Security"), href: "/security" },
        { label: t("footer.sla", "SLA"), href: "/sla" },
      ],
    },
  ];

  return (
    <footer className="border-t border-gray-200 bg-gray-50">
      <div className="mx-auto max-w-7xl px-4 py-16 sm:px-6 lg:px-8">
        <div className="grid grid-cols-2 gap-8 md:grid-cols-4 lg:gap-12">
          {columns.map((col) => (
            <div key={col.title}>
              <h4 className="mb-4 text-sm font-semibold text-gray-900">{col.title}</h4>
              <ul className="space-y-3">
                {col.links.map((link) => (
                  <li key={link.href}>
                    <Link
                      href={link.href}
                      className="text-sm text-gray-500 transition-colors hover:text-gray-900"
                    >
                      {link.label}
                    </Link>
                  </li>
                ))}
              </ul>
            </div>
          ))}
        </div>

        <div className="mt-12 flex flex-col items-center justify-between gap-4 border-t border-gray-200 pt-8 md:flex-row">
          <div className="flex items-center gap-2">
            <div className="flex h-7 w-7 items-center justify-center rounded-md bg-gradient-to-br from-blue-600 to-indigo-600">
              <Sparkles className="h-3.5 w-3.5 text-white" />
            </div>
            <span className="text-sm font-semibold text-gray-900">
              TaskMatch<span className="text-indigo-600">.ai</span>
            </span>
          </div>
          <p className="text-sm text-gray-400">
            {t("footer.copyright", "\u00a9 2026 TaskMatch.ai. All rights reserved.")}
          </p>
        </div>
      </div>
    </footer>
  );
}

/* -------------------------------------------------------------------------- */
/*  Layout                                                                     */
/* -------------------------------------------------------------------------- */

export default function PublicLayout({ children }: { children: React.ReactNode }) {
  return (
    <div className="min-h-screen bg-white">
      <PublicNavbar />
      <main className="pt-16">{children}</main>
      <PublicFooter />
    </div>
  );
}
