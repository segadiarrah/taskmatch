import * as React from "react";
import { cn } from "@/lib/utils";

export interface BadgeProps extends React.HTMLAttributes<HTMLDivElement> {
  variant?: "default" | "secondary" | "destructive" | "outline" | "success" | "warning" | "info" | "purple";
}

/* Mono "stamp" badges — ledger style */
const badgeVariants: Record<string, string> = {
  default: "border-signal-500/40 bg-signal-500/10 text-signal-400",
  secondary: "border-ink-600 bg-ink-800 text-ink-300",
  destructive: "border-danger/40 bg-danger/10 text-danger",
  outline: "border-ink-600 text-ink-300",
  success: "border-success/40 bg-success/10 text-success",
  warning: "border-warning/40 bg-warning/10 text-warning",
  info: "border-info/40 bg-info/10 text-info",
  purple: "border-[#b49aff]/40 bg-[#b49aff]/10 text-[#b49aff]",
};

function Badge({ className, variant = "default", ...props }: BadgeProps) {
  return (
    <div
      className={cn(
        "inline-flex items-center rounded-sm border px-2 py-0.5 font-mono text-[11px] font-medium uppercase tracking-wider transition-colors",
        badgeVariants[variant],
        className
      )}
      {...props}
    />
  );
}

export { Badge };
