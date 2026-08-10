import * as React from "react";
import { cn } from "@/lib/utils";

interface ProgressProps extends React.HTMLAttributes<HTMLDivElement> {
  value?: number;
  max?: number;
  indicatorClassName?: string;
}

function Progress({ className, value = 0, max = 100, indicatorClassName, ...props }: ProgressProps) {
  const percentage = Math.min(Math.max((value / max) * 100, 0), 100);

  return (
    <div
      className={cn("relative h-1.5 w-full overflow-hidden rounded-full bg-ink-800", className)}
      {...props}
    >
      <div
        className={cn("h-full rounded-full bg-signal-500 transition-all duration-300", indicatorClassName)}
        style={{ width: `${percentage}%` }}
      />
    </div>
  );
}

export { Progress };
