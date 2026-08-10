import * as React from "react";
import { cn } from "@/lib/utils";

export interface ButtonProps extends React.ButtonHTMLAttributes<HTMLButtonElement> {
  variant?: "default" | "destructive" | "outline" | "secondary" | "ghost" | "link";
  size?: "default" | "sm" | "lg" | "icon";
}

const buttonVariants: Record<string, string> = {
  default:
    "bg-primary text-primary-foreground font-semibold hover:bg-signal-400 hover:shadow-glow-sm",
  destructive:
    "bg-destructive text-destructive-foreground font-semibold hover:brightness-110",
  outline:
    "border border-ink-600 bg-transparent text-foreground hover:border-ink-400 hover:bg-ink-800",
  secondary: "bg-ink-800 text-foreground hover:bg-ink-700 border border-ink-700",
  ghost: "text-ink-300 hover:bg-ink-800 hover:text-foreground",
  link: "text-primary underline-offset-4 hover:underline",
};

const buttonSizes: Record<string, string> = {
  default: "h-9 px-4 py-2",
  sm: "h-8 rounded-md px-3 text-xs",
  lg: "h-10 rounded-md px-8",
  icon: "h-9 w-9",
};

const Button = React.forwardRef<HTMLButtonElement, ButtonProps>(
  ({ className, variant = "default", size = "default", ...props }, ref) => {
    return (
      <button
        className={cn(
          "inline-flex items-center justify-center whitespace-nowrap rounded-md text-sm font-medium transition-all focus-visible:outline-none focus-visible:ring-1 focus-visible:ring-ring disabled:pointer-events-none disabled:opacity-50",
          buttonVariants[variant],
          buttonSizes[size],
          className
        )}
        ref={ref}
        {...props}
      />
    );
  }
);
Button.displayName = "Button";

export { Button };
