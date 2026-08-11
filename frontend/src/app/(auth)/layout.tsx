import Link from "next/link";
import { Layers } from "lucide-react";

export default function AuthLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <div className="relative flex min-h-screen flex-col items-center justify-center overflow-hidden bg-ink-950 px-4 py-12">
      <div className="pointer-events-none absolute inset-0 bg-signal-glow" aria-hidden="true" />

      <div className="relative mb-8">
        <Link href="/" className="group flex items-center gap-2.5">
          <span className="flex h-9 w-9 items-center justify-center rounded-xl bg-signal-500 transition-transform group-hover:scale-[1.04]">
            <Layers className="h-4 w-4 text-ink-950" />
          </span>
          <span className="text-lg font-semibold tracking-tight text-ink-50">
            TaskMatch<span className="text-signal-500">.ai</span>
          </span>
        </Link>
      </div>

      <div className="relative w-full max-w-md">
        <div className="rounded-2xl border border-ink-800 bg-white p-8 shadow-panel">
          {children}
        </div>
        <p className="mt-6 text-center font-mono text-[10px] uppercase tracking-widest text-ink-500">
          mission control access
        </p>
      </div>
    </div>
  );
}
