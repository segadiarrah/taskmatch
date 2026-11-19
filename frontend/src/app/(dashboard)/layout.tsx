"use client";

import React, { Suspense, useState, useEffect } from "react";
import Link from "next/link";
import { useRouter, usePathname, useSearchParams } from "next/navigation";
import { useAuth } from "@/lib/auth";
import { useTranslation } from "@/lib/i18n";
import { LanguageSwitcher } from "@/components/language-switcher";
import { displayCopy } from "@/lib/display-copy";
import type { Locale } from "@/lib/locales";
import { dashboardActionsCopy } from "@/lib/dashboard-actions-copy";
import { authIntentHref } from "@/lib/public-intent";
import { DataLoadError } from "@/components/dashboard/data-load-error";
import { cn } from "@/lib/utils";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Avatar, AvatarFallback } from "@/components/ui/avatar";
import {
  LayoutDashboard,
  Briefcase,
  ListChecks,
  Bot,
  Gavel,
  FileCheck,
  ShieldCheck,
  CreditCard,
  GraduationCap,
  ScrollText,
  Plug,
  Menu,
  X,
  LogOut,
  ChevronLeft,
  Layers,
  Handshake,
  UserRound,
} from "lucide-react";

interface NavItem {
  label: string;
  href: string;
  icon: React.ElementType;
  roles: string[];
  human?: boolean;
}

/* Les libellés suivent la langue courante : la liste ne peut pas être figée
   au chargement du module. */
const buildNavItems = (t: (key: string) => string, locale: Locale): NavItem[] => [
  { label: t("dashboard.overview"), href: "/client", icon: LayoutDashboard, roles: ["client"] },
  { label: t("dashboard.jobs"), href: "/client/jobs", icon: Briefcase, roles: ["client"] },
  { label: t("dashboard.overview"), href: "/developer", icon: LayoutDashboard, roles: ["agent_developer"] },
  { label: t("dashboard.agents"), href: "/developer/agents", icon: Bot, roles: ["agent_developer"] },
  { label: t("dashboard.tasks"), href: "/developer/tasks", icon: ListChecks, roles: ["agent_developer"] },
  { label: t("dashboard.payments"), href: "/developer/earnings", icon: CreditCard, roles: ["agent_developer"] },
  { label: t("dashboard.overview"), href: "/admin", icon: LayoutDashboard, roles: ["admin"] },
  { label: t("dashboard.jobs"), href: "/admin/jobs", icon: Briefcase, roles: ["admin"] },
  { label: t("dashboard.tasks"), href: "/admin/tasks", icon: ListChecks, roles: ["admin"] },
  { label: t("dashboard.agents"), href: "/admin/agents", icon: Bot, roles: ["admin"] },
  { label: t("dashboard.validations"), href: "/admin/validations", icon: ShieldCheck, roles: ["admin"] },
  { label: t("dashboard.payments"), href: "/admin/payments", icon: CreditCard, roles: ["admin"] },
  { label: t("dashboard.learning"), href: "/admin/learning", icon: GraduationCap, roles: ["admin"] },
  { label: t("dashboard.providers"), href: "/admin/providers", icon: Plug, roles: ["admin"] },
  { label: t("dashboard.audit"), href: "/admin/audit", icon: ScrollText, roles: ["admin"] },
  { label: dashboardActionsCopy[locale].humanTasks, href: "/human-tasks", icon: Handshake, roles: ["client", "agent_developer", "admin"], human: true },
  { label: dashboardActionsCopy[locale].humanRequest, href: "/human-tasks?view=request", icon: Briefcase, roles: ["client"], human: true },
  { label: dashboardActionsCopy[locale].delegation, href: "/human-tasks?view=agents", icon: Bot, roles: ["agent_developer"], human: true },
  { label: dashboardActionsCopy[locale].humanWork, href: "/human-tasks?view=work", icon: UserRound, roles: ["client", "agent_developer"], human: true },
  { label: dashboardActionsCopy[locale].reviewHumanMissions, href: "/human-tasks?view=review", icon: ShieldCheck, roles: ["admin"], human: true },
];

function getInitials(name: string): string {
  return name
    .split(" ")
    .map((n) => n[0])
    .join("")
    .toUpperCase()
    .slice(0, 2);
}

function getRoleBadgeVariant(role: string): "default" | "info" | "purple" {
  switch (role) {
    case "admin":
      return "default";
    case "client":
      return "info";
    case "agent_developer":
      return "purple";
    default:
      return "default";
  }
}

function getRoleLabel(role: string, locale: Locale): string {
  switch (role) {
    case "admin":
      return displayCopy[locale].roleAdmin;
    case "client":
      return displayCopy[locale].roleClient;
    case "agent_developer":
      return displayCopy[locale].roleDeveloper;
    default:
      return role;
  }
}

function DashboardLayoutContent({
  children,
}: {
  children: React.ReactNode;
}) {
  const { t, locale } = useTranslation();
  const { user, isLoading, isAuthenticated, authError, retrySession, logout } = useAuth();
  const router = useRouter();
  const pathname = usePathname();
  const searchParams = useSearchParams();
  const [sidebarOpen, setSidebarOpen] = useState(false);
  const [sidebarCollapsed, setSidebarCollapsed] = useState(false);

  useEffect(() => {
    if (!isLoading && !isAuthenticated && !authError) {
      const view = new URLSearchParams(window.location.search).get("view");
      router.push(pathname.startsWith("/human-tasks") ? authIntentHref("login", view === "work" ? "work" : view === "agents" ? "agent" : "mission") : "/login");
    }
  }, [isLoading, isAuthenticated, authError, router, pathname]);

  if (isLoading) {
    return (
      <div className="flex h-screen items-center justify-center bg-ink-950">
        <div className="flex flex-col items-center gap-3">
          <div className="h-8 w-8 animate-spin rounded-full border-2 border-ink-800 border-t-signal-500" />
          <p className="font-mono text-sm text-ink-500">{t("dashboard.loadingApp")}</p>
        </div>
      </div>
    );
  }

  if (authError) {
    return <main className="mx-auto max-w-2xl px-6 py-20"><DataLoadError onRetry={retrySession} /></main>;
  }

  if (!isAuthenticated || !user) {
    return null;
  }

  const filteredNavItems = buildNavItems(t, locale).filter((item) =>
    item.roles.includes(user.role)
  );

  const isActive = (href: string) => {
    if (href.startsWith("/human-tasks")) {
      const view = href.split("?view=")[1];
      return pathname === "/human-tasks" && (view ? searchParams.get("view") === view : !searchParams.get("view"));
    }
    if (href === "/admin" || href === "/client" || href === "/developer") return pathname === href;
    return pathname.startsWith(href);
  };

  return (
    <div className="flex h-screen bg-ink-950">
      {/* Mobile overlay */}
      {sidebarOpen && (
        <div
          className="fixed inset-0 z-40 bg-ink-50/25 backdrop-blur-sm lg:hidden"
          onClick={() => setSidebarOpen(false)}
        />
      )}

      {/* Sidebar */}
      <aside
        className={cn(
          "fixed inset-y-0 left-0 z-50 flex flex-col border-r border-ink-800 bg-white transition-all duration-300 lg:relative lg:z-0",
          sidebarCollapsed ? "w-[64px]" : "w-[236px]",
          sidebarOpen ? "translate-x-0" : "-translate-x-full lg:translate-x-0"
        )}
      >
        {/* Logo */}
        <div className={cn(
          "flex h-14 items-center border-b border-ink-800 px-4",
          sidebarCollapsed ? "justify-center" : "justify-between"
        )}>
          {!sidebarCollapsed && (
            <div className="flex items-center gap-2">
              <div className="flex h-7 w-7 items-center justify-center rounded-lg bg-signal-500">
                <Layers className="h-4 w-4 text-ink-950" />
              </div>
              <div>
                <span className="text-sm font-bold tracking-tight text-ink-50">TaskMatch</span>
                <p className="font-mono text-[9px] uppercase tracking-wider text-ink-500">{t("dashboard.console")}</p>
              </div>
            </div>
          )}
          {sidebarCollapsed && (
            <div className="flex h-7 w-7 items-center justify-center rounded-lg bg-signal-500">
              <Layers className="h-4 w-4 text-ink-950" />
            </div>
          )}
          <button
            type="button"
            aria-label={sidebarCollapsed ? t("dashboard.expandSidebar") : t("dashboard.collapseSidebar")}
            onClick={() => setSidebarCollapsed(!sidebarCollapsed)}
            className="hidden rounded-lg p-1.5 text-ink-500 hover:bg-ink-900 hover:text-ink-200 lg:block"
          >
            <ChevronLeft className={cn("h-4 w-4 transition-transform", sidebarCollapsed && "rotate-180")} />
          </button>
          <button
            type="button"
            aria-label={t("dashboard.closeNav")}
            onClick={() => setSidebarOpen(false)}
            className="rounded-lg p-1.5 text-ink-500 hover:bg-ink-900 hover:text-ink-200 lg:hidden"
          >
            <X className="h-4 w-4" />
          </button>
        </div>

        {/* Navigation */}
        <nav className="flex-1 space-y-1 overflow-y-auto px-2.5 py-3">
          {filteredNavItems.map((item) => {
            const active = isActive(item.href);
            const Icon = item.icon;
            return (
              <Link
                key={item.href}
                href={item.href}
                aria-current={active ? "page" : undefined}
                onClick={() => {
                  setSidebarOpen(false);
                }}
                className={cn(
                  "relative flex w-full items-center gap-3 rounded-lg border px-3 py-2 text-sm font-medium transition-colors",
                  item.href === "/human-tasks" && "!mt-4 border-t border-t-ink-800",
                  active
                    ? "border-ink-800 bg-ink-950 text-ink-50 shadow-sm"
                    : "border-transparent text-ink-400 hover:bg-ink-900 hover:text-ink-100",
                  sidebarCollapsed && "justify-center px-2"
                )}
                aria-label={sidebarCollapsed ? item.label : undefined}
                title={sidebarCollapsed ? item.label : undefined}
              >
                <Icon className={cn("h-4 w-4 shrink-0", active && "text-signal-400")} />
                {!sidebarCollapsed && <span className={cn("min-w-0 break-words text-left", item.human && item.href !== "/human-tasks" && "text-xs")}>{item.label}</span>}
              </Link>
            );
          })}
        </nav>

        {/* User section at bottom */}
        {!sidebarCollapsed && (
          <div className="border-t border-ink-800 p-3">
            <div className="flex items-center gap-3">
              <Avatar size="sm">
                <AvatarFallback>{getInitials(user.full_name)}</AvatarFallback>
              </Avatar>
              <div className="flex-1 truncate">
                <p className="truncate text-sm font-medium text-ink-100">{user.full_name}</p>
                <p className="truncate font-mono text-xs text-ink-500">{user.email}</p>
              </div>
            </div>
          </div>
        )}
      </aside>

      {/* Main content area */}
      <div className="flex min-w-0 flex-1 flex-col overflow-hidden">
        {/* Top bar */}
        <header className="flex h-14 items-center justify-between border-b border-ink-800 bg-white/90 px-4 backdrop-blur-xl lg:px-6">
          <div className="flex items-center gap-3">
            <button
              type="button"
              aria-label={t("dashboard.openNav")}
              onClick={() => setSidebarOpen(true)}
              className="rounded-lg p-2 text-ink-500 hover:bg-ink-900 hover:text-ink-200 lg:hidden"
            >
              <Menu className="h-5 w-5" />
            </button>
            <div className="hidden items-center gap-2 text-sm lg:flex">
              <span className="font-mono text-[11px] uppercase tracking-wider text-ink-500">
                {getRoleLabel(user.role, locale)}
              </span>
              <span className="text-ink-700">/</span>
              <span className="font-medium text-ink-50">
                {filteredNavItems.find((item) => isActive(item.href))?.label || t("dashboard.dashboard")}
              </span>
            </div>
          </div>

          <div className="flex items-center gap-2 sm:gap-3">
            <LanguageSwitcher />
            <Badge variant={getRoleBadgeVariant(user.role)}>
              {getRoleLabel(user.role, locale)}
            </Badge>
            <div className="hidden items-center gap-2 sm:flex">
              <Avatar size="sm">
                <AvatarFallback>{getInitials(user.full_name)}</AvatarFallback>
              </Avatar>
              <span className="text-sm font-medium text-ink-200">{user.full_name}</span>
            </div>
            <Button variant="ghost" size="sm" onClick={() => { logout(); router.push("/login"); }}>
              <LogOut className="mr-1 h-4 w-4" />
              <span className="hidden sm:inline">{t("dashboard.logout")}</span>
            </Button>
          </div>
        </header>

        {/* Page content */}
        <main lang={locale} className="min-w-0 flex-1 overflow-y-auto bg-ink-950 p-4 lg:p-7">
          {children}
        </main>
      </div>
    </div>
  );
}

export default function DashboardLayout({ children }: { children: React.ReactNode }) {
  return <Suspense fallback={null}><DashboardLayoutContent>{children}</DashboardLayoutContent></Suspense>;
}
