"use client";

import React, { useState, useEffect } from "react";
import { useRouter, usePathname } from "next/navigation";
import { useAuth } from "@/lib/auth";
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
} from "lucide-react";

interface NavItem {
  label: string;
  href: string;
  icon: React.ElementType;
  roles: string[];
}

const navItems: NavItem[] = [
  { label: "Overview", href: "/admin", icon: LayoutDashboard, roles: ["admin"] },
  { label: "Jobs", href: "/admin/jobs", icon: Briefcase, roles: ["admin", "client"] },
  { label: "Tasks", href: "/admin/tasks", icon: ListChecks, roles: ["admin", "client", "agent_developer"] },
  { label: "Agents", href: "/admin/agents", icon: Bot, roles: ["admin", "agent_developer"] },
  { label: "Bids", href: "/admin/tasks", icon: Gavel, roles: ["agent_developer"] },
  { label: "Submissions", href: "/admin/validations", icon: FileCheck, roles: ["agent_developer"] },
  { label: "Validations", href: "/admin/validations", icon: ShieldCheck, roles: ["admin"] },
  { label: "Payments", href: "/admin/payments", icon: CreditCard, roles: ["admin", "client", "agent_developer"] },
  { label: "Learning", href: "/admin/learning", icon: GraduationCap, roles: ["admin"] },
  { label: "AI Providers", href: "/admin/providers", icon: Plug, roles: ["admin"] },
  { label: "Audit Log", href: "/admin/audit", icon: ScrollText, roles: ["admin"] },
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

function getRoleLabel(role: string): string {
  switch (role) {
    case "admin":
      return "Admin";
    case "client":
      return "Client";
    case "agent_developer":
      return "Developer";
    default:
      return role;
  }
}

export default function DashboardLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  const { user, isLoading, isAuthenticated, logout } = useAuth();
  const router = useRouter();
  const pathname = usePathname();
  const [sidebarOpen, setSidebarOpen] = useState(false);
  const [sidebarCollapsed, setSidebarCollapsed] = useState(false);

  useEffect(() => {
    if (!isLoading && !isAuthenticated) {
      router.push("/login");
    }
  }, [isLoading, isAuthenticated, router]);

  if (isLoading) {
    return (
      <div className="flex h-screen items-center justify-center bg-ink-950">
        <div className="flex flex-col items-center gap-3">
          <div className="h-8 w-8 animate-spin rounded-full border-2 border-ink-700 border-t-signal-500" />
          <p className="font-mono text-sm text-ink-500">Loading TaskMatch...</p>
        </div>
      </div>
    );
  }

  if (!isAuthenticated || !user) {
    return null;
  }

  const filteredNavItems = navItems.filter((item) =>
    item.roles.includes(user.role)
  );

  const isActive = (href: string) => {
    if (href === "/admin") return pathname === "/admin";
    return pathname.startsWith(href);
  };

  return (
    <div className="flex h-screen bg-ink-950">
      {/* Mobile overlay */}
      {sidebarOpen && (
        <div
          className="fixed inset-0 z-40 bg-black/70 lg:hidden"
          onClick={() => setSidebarOpen(false)}
        />
      )}

      {/* Sidebar */}
      <aside
        className={cn(
          "fixed inset-y-0 left-0 z-50 flex flex-col border-r border-ink-800 bg-ink-900 transition-all duration-300 lg:relative lg:z-0",
          sidebarCollapsed ? "w-[68px]" : "w-64",
          sidebarOpen ? "translate-x-0" : "-translate-x-full lg:translate-x-0"
        )}
      >
        {/* Logo */}
        <div className={cn(
          "flex h-16 items-center border-b border-ink-800 px-4",
          sidebarCollapsed ? "justify-center" : "justify-between"
        )}>
          {!sidebarCollapsed && (
            <div className="flex items-center gap-2">
              <div className="flex h-8 w-8 items-center justify-center rounded-sm bg-signal-500">
                <Layers className="h-4 w-4 text-ink-950" />
              </div>
              <div>
                <h1 className="text-sm font-bold tracking-tight text-ink-50">TaskMatch</h1>
                <p className="font-mono text-[10px] uppercase tracking-wider text-ink-500">Mission Control</p>
              </div>
            </div>
          )}
          {sidebarCollapsed && (
            <div className="flex h-8 w-8 items-center justify-center rounded-sm bg-signal-500">
              <Layers className="h-4 w-4 text-ink-950" />
            </div>
          )}
          <button
            type="button"
            aria-label={sidebarCollapsed ? "Expand sidebar" : "Collapse sidebar"}
            onClick={() => setSidebarCollapsed(!sidebarCollapsed)}
            className="hidden rounded-md p-1 text-ink-500 hover:bg-ink-800 hover:text-ink-200 lg:block"
          >
            <ChevronLeft className={cn("h-4 w-4 transition-transform", sidebarCollapsed && "rotate-180")} />
          </button>
          <button
            type="button"
            aria-label="Close navigation"
            onClick={() => setSidebarOpen(false)}
            className="rounded-md p-1 text-ink-500 hover:bg-ink-800 hover:text-ink-200 lg:hidden"
          >
            <X className="h-4 w-4" />
          </button>
        </div>

        {/* Navigation */}
        <nav className="flex-1 space-y-1 overflow-y-auto px-3 py-4">
          {filteredNavItems.map((item) => {
            const active = isActive(item.href);
            const Icon = item.icon;
            return (
              <button
                key={item.label}
                onClick={() => {
                  router.push(item.href);
                  setSidebarOpen(false);
                }}
                className={cn(
                  "relative flex w-full items-center gap-3 rounded-md px-3 py-2 text-sm font-medium transition-colors",
                  active
                    ? "bg-ink-800 text-ink-50"
                    : "text-ink-400 hover:bg-ink-850 hover:text-ink-100",
                  sidebarCollapsed && "justify-center px-2"
                )}
                title={sidebarCollapsed ? item.label : undefined}
              >
                {active && (
                  <span className="absolute left-0 top-1/2 h-5 w-0.5 -translate-y-1/2 rounded-full bg-signal-500" />
                )}
                <Icon className={cn("h-4 w-4 shrink-0", active && "text-signal-400")} />
                {!sidebarCollapsed && <span>{item.label}</span>}
              </button>
            );
          })}
        </nav>

        {/* User section at bottom */}
        {!sidebarCollapsed && (
          <div className="border-t border-ink-800 p-4">
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
      <div className="flex flex-1 flex-col overflow-hidden">
        {/* Top bar */}
        <header className="flex h-16 items-center justify-between border-b border-ink-800 bg-ink-900 px-4 lg:px-6">
          <div className="flex items-center gap-3">
            <button
              type="button"
              aria-label="Open navigation"
              onClick={() => setSidebarOpen(true)}
              className="rounded-md p-2 text-ink-500 hover:bg-ink-800 hover:text-ink-200 lg:hidden"
            >
              <Menu className="h-5 w-5" />
            </button>
            <div className="hidden items-center gap-2 text-sm lg:flex">
              <span className="font-mono text-[11px] uppercase tracking-wider text-ink-500">
                {getRoleLabel(user.role)}
              </span>
              <span className="text-ink-700">/</span>
              <span className="font-medium text-ink-50">
                {filteredNavItems.find((item) => isActive(item.href))?.label || "Dashboard"}
              </span>
            </div>
          </div>

          <div className="flex items-center gap-3">
            <Badge variant={getRoleBadgeVariant(user.role)}>
              {getRoleLabel(user.role)}
            </Badge>
            <div className="hidden items-center gap-2 sm:flex">
              <Avatar size="sm">
                <AvatarFallback>{getInitials(user.full_name)}</AvatarFallback>
              </Avatar>
              <span className="text-sm font-medium text-ink-200">{user.full_name}</span>
            </div>
            <Button variant="ghost" size="sm" onClick={() => { logout(); router.push("/login"); }}>
              <LogOut className="mr-1 h-4 w-4" />
              <span className="hidden sm:inline">Logout</span>
            </Button>
          </div>
        </header>

        {/* Page content */}
        <main className="flex-1 overflow-y-auto bg-ink-950 p-4 lg:p-6">
          {children}
        </main>
      </div>
    </div>
  );
}
