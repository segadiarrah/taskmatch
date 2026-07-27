"use client";

import React, { useState } from "react";
import Link from "next/link";
import { usePathname } from "next/navigation";
import { Button } from "@/components/ui/button";
import { LanguageSwitcher } from "@/components/language-switcher";
import { useTranslation } from "@/lib/i18n";
import { cn } from "@/lib/utils";
import {
  BookOpen,
  Building2,
  ChevronDown,
  FileText,
  HelpCircle,
  History,
  Lock,
  Menu,
  Scale,
  Shield,
  Sparkles,
  Users,
  X,
} from "lucide-react";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";

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
        description: t("nav.howItWorksDesc", "See the four-step execution flow"),
      },
      {
        label: t("nav.changelog", "Changelog"),
        href: "/changelog",
        icon: History,
        description: t("nav.changelogDesc", "Recent product updates"),
      },
      {
        label: t("nav.docs", "Documentation"),
        href: "/resources/documentation",
        icon: FileText,
        description: t("nav.docsDesc", "Technical docs and references"),
      },
      {
        label: t("nav.faq", "FAQ"),
        href: "/pricing#faq",
        icon: HelpCircle,
        description: t("nav.faqDesc", "Common questions answered"),
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
        description: t("nav.forClientsDesc", "For teams that need structured execution"),
      },
      {
        label: t("nav.forDevelopers", "For Developers"),
        href: "/for-developers",
        icon: Users,
        description: t("nav.forDevsDesc", "For builders delivering agent-powered work"),
      },
    ],
  };

  const legal: NavDropdownGroup = {
    label: t("nav.legal", "Legal"),
    items: [
      {
        label: t("nav.privacy", "Privacy Policy"),
        href: "/legal/privacy",
        icon: Shield,
        description: t("nav.privacyDesc", "How data is handled and protected"),
      },
      {
        label: t("nav.terms", "Terms of Service"),
        href: "/legal/terms",
        icon: Scale,
        description: t("nav.termsDesc", "Commercial and platform terms"),
      },
      {
        label: t("nav.security", "Security"),
        href: "/legal/security",
        icon: Lock,
        description: t("nav.securityDesc", "Security posture and controls"),
      },
    ],
  };

  return { resources, company, legal };
}

function NavDropdown({ group }: { group: NavDropdownGroup }) {
  return (
    <DropdownMenu>
      <DropdownMenuTrigger className="flex items-center gap-1 text-sm font-medium text-stone-600 transition-colors hover:text-stone-950">
        {group.label}
        <ChevronDown className="h-3.5 w-3.5" />
      </DropdownMenuTrigger>
      <DropdownMenuContent
        align="start"
        className="w-80 rounded-[1.25rem] border-stone-200/80 bg-[rgba(255,255,255,0.95)] p-2 shadow-[0_18px_40px_rgba(21,23,24,0.12)]"
      >
        {group.items.map((item) => {
          const Icon = item.icon;
          return (
            <Link key={item.href} href={item.href}>
              <DropdownMenuItem className="flex items-start gap-3 rounded-2xl p-3">
                <div className="mt-0.5 flex h-9 w-9 shrink-0 items-center justify-center rounded-xl bg-[#f3ede2] text-stone-900">
                  <Icon className="h-4 w-4" />
                </div>
                <div>
                  <div className="text-sm font-medium text-stone-950">{item.label}</div>
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

function PublicNavbar() {
  const [mobileOpen, setMobileOpen] = useState(false);
  const pathname = usePathname();
  const { t } = useTranslation();
  const { resources, company, legal } = useNavConfig();

  const directLinks = [{ label: t("nav.pricing", "Pricing"), href: "/pricing" }];

  return (
    <header className="fixed top-0 z-50 w-full border-b border-stone-900/10 bg-[rgba(247,243,236,0.82)] backdrop-blur-xl">
      <div className="mx-auto flex h-16 max-w-7xl items-center justify-between px-4 sm:px-6 lg:px-8">
        <Link href="/" className="flex items-center gap-3">
          <div className="flex h-9 w-9 items-center justify-center rounded-2xl border border-white/70 bg-stone-950 shadow-[0_12px_30px_rgba(21,23,24,0.18)]">
            <Sparkles className="h-4 w-4 text-stone-100" />
          </div>
          <span className="text-sm font-semibold uppercase tracking-[0.28em] text-stone-500">
            TaskMatch.ai
          </span>
        </Link>

        <nav className="hidden items-center gap-6 lg:flex">
          <NavDropdown group={resources} />
          <NavDropdown group={company} />
          <NavDropdown group={legal} />
          {directLinks.map((link) => (
            <Link
              key={link.href}
              href={link.href}
              className={cn(
                "text-sm font-medium transition-colors hover:text-stone-950",
                pathname === link.href ? "text-stone-950" : "text-stone-600"
              )}
            >
              {link.label}
            </Link>
          ))}
        </nav>

        <div className="hidden items-center gap-3 lg:flex">
          <LanguageSwitcher />
          <Link href="/login">
            <Button variant="ghost" size="sm" className="text-stone-700 hover:bg-stone-900/5">
              {t("nav.signIn", "Sign In")}
            </Button>
          </Link>
          <Link href="/register">
            <Button
              size="sm"
              className="rounded-full bg-stone-950 px-5 text-stone-50 shadow-[0_14px_35px_rgba(21,23,24,0.18)] hover:bg-stone-800"
            >
              Start your task
            </Button>
          </Link>
        </div>

        <button
          className="inline-flex h-10 w-10 items-center justify-center rounded-full border border-stone-900/10 bg-white/60 text-stone-900 lg:hidden"
          onClick={() => setMobileOpen((open) => !open)}
          aria-label="Toggle menu"
        >
          {mobileOpen ? <X className="h-5 w-5" /> : <Menu className="h-5 w-5" />}
        </button>
      </div>

      {mobileOpen && (
        <div className="border-t border-stone-900/10 bg-[#f7f3ec] px-4 py-4 lg:hidden">
          <div className="space-y-4">
            {[resources, company, legal].map((group) => (
              <div key={group.label}>
                <div className="mb-2 px-2 text-xs font-semibold uppercase tracking-[0.22em] text-stone-400">
                  {group.label}
                </div>
                <div className="space-y-1">
                  {group.items.map((item) => {
                    const Icon = item.icon;
                    return (
                      <Link
                        key={item.href}
                        href={item.href}
                        onClick={() => setMobileOpen(false)}
                        className="flex items-center gap-3 rounded-2xl px-3 py-3 text-sm font-medium text-stone-700 hover:bg-white/70"
                      >
                        <Icon className="h-4 w-4 text-stone-400" />
                        {item.label}
                      </Link>
                    );
                  })}
                </div>
              </div>
            ))}
            {directLinks.map((link) => (
              <Link
                key={link.href}
                href={link.href}
                onClick={() => setMobileOpen(false)}
                className="block rounded-2xl px-3 py-3 text-sm font-medium text-stone-700 hover:bg-white/70"
              >
                {link.label}
              </Link>
            ))}
          </div>

          <div className="mt-4 flex items-center gap-3 border-t border-stone-900/10 pt-4">
            <LanguageSwitcher />
            <Link href="/login" className="flex-1">
              <Button variant="outline" size="sm" className="w-full rounded-full border-stone-300 bg-white/70">
                {t("nav.signIn", "Sign In")}
              </Button>
            </Link>
            <Link href="/register" className="flex-1">
              <Button size="sm" className="w-full rounded-full bg-stone-950 text-white hover:bg-stone-800">
                Start your task
              </Button>
            </Link>
          </div>
        </div>
      )}
    </header>
  );
}

function PublicFooter() {
  const { t } = useTranslation();
  const year = new Date().getFullYear();

  const columns = [
    {
      title: t("footer.product", "Product"),
      links: [
        { label: t("footer.howItWorks", "How It Works"), href: "/how-it-works" },
        { label: t("footer.pricing", "Pricing"), href: "/pricing" },
        { label: t("footer.changelog", "Changelog"), href: "/changelog" },
        { label: t("footer.docs", "Documentation"), href: "/resources/documentation" },
      ],
    },
    {
      title: t("footer.solutions", "Solutions"),
      links: [
        { label: t("footer.forClients", "For Clients"), href: "/for-clients" },
        { label: t("footer.forDevelopers", "For Developers"), href: "/for-developers" },
        { label: t("footer.enterprise", "Enterprise"), href: "/pricing#enterprise" },
        { label: t("footer.agentSDK", "Agent SDK"), href: "/resources/sdk" },
      ],
    },
    {
      title: t("footer.company", "Company"),
      links: [
        { label: t("footer.about", "About"), href: "/company/about" },
        { label: t("footer.careers", "Careers"), href: "/company/careers" },
        { label: t("footer.contact", "Contact"), href: "/company/contact" },
        { label: t("footer.blog", "Blog"), href: "/resources/blog" },
      ],
    },
    {
      title: t("footer.legal", "Legal"),
      links: [
        { label: t("footer.privacy", "Privacy Policy"), href: "/legal/privacy" },
        { label: t("footer.terms", "Terms of Service"), href: "/legal/terms" },
        { label: t("footer.security", "Security"), href: "/legal/security" },
        { label: t("footer.sla", "Compliance"), href: "/legal/compliance" },
      ],
    },
  ];

  return (
    <footer className="border-t border-stone-900/8 bg-[#efe7d8]">
      <div className="mx-auto max-w-7xl px-4 py-14 sm:px-6 lg:px-8">
        <div className="grid grid-cols-2 gap-8 md:grid-cols-4 lg:gap-12">
          {columns.map((column) => (
            <div key={column.title}>
              <h4 className="mb-4 text-sm font-semibold uppercase tracking-[0.18em] text-stone-500">
                {column.title}
              </h4>
              <ul className="space-y-3">
                {column.links.map((link) => (
                  <li key={link.href}>
                    <Link
                      href={link.href}
                      className="text-sm text-stone-600 transition-colors hover:text-stone-950"
                    >
                      {link.label}
                    </Link>
                  </li>
                ))}
              </ul>
            </div>
          ))}
        </div>

        <div className="mt-10 flex flex-col gap-4 border-t border-stone-900/10 pt-6 md:flex-row md:items-center md:justify-between">
          <div className="flex items-center gap-3">
            <div className="flex h-8 w-8 items-center justify-center rounded-2xl bg-stone-950 text-white">
              <Sparkles className="h-4 w-4" />
            </div>
            <span className="text-sm font-semibold uppercase tracking-[0.22em] text-stone-500">
              TaskMatch.ai
            </span>
          </div>
          <p className="text-sm text-stone-500">
            {t("footer.copyright", `\u00a9 ${year} TaskMatch.ai. All rights reserved.`)}
          </p>
        </div>
      </div>
    </footer>
  );
}

export default function PublicLayout({ children }: { children: React.ReactNode }) {
  return (
    <div className="min-h-screen bg-[#f7f3ec]">
      <PublicNavbar />
      <main className="pt-16">{children}</main>
      <PublicFooter />
    </div>
  );
}
