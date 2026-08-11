import * as React from "react";
import { cn } from "@/lib/utils";

export interface BadgeProps extends React.HTMLAttributes<HTMLDivElement> {
  variant?: "default" | "secondary" | "destructive" | "outline" | "success" | "warning" | "info" | "purple";
}

/* Compact status badges */
const badgeVariants: Record<string, string> = {
  default: "border-signal-500/40 bg-signal-500/10 text-signal-400",
  secondary: "border-ink-800 bg-ink-900 text-ink-300",
  destructive: "border-danger/40 bg-danger/10 text-danger",
  outline: "border-ink-700 bg-white text-ink-300",
  success: "border-success/40 bg-success/10 text-success",
  warning: "border-warning/40 bg-warning/10 text-warning",
  info: "border-info/40 bg-info/10 text-info",
  purple: "border-signal-500/25 bg-signal-500/10 text-signal-600",
};

function Badge({ className, variant = "default", ...props }: BadgeProps) {
  return (
    <div
      className={cn(
        "inline-flex items-center rounded-full border px-2 py-0.5 font-mono text-[10px] font-medium uppercase tracking-wider transition-colors",
        badgeVariants[variant],
        className
      )}
      {...props}
    />
  );
}

export { Badge };
