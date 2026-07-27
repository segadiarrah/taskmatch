import Link from "next/link";
import { Sparkles } from "lucide-react";

export default function AuthLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <div className="relative flex min-h-screen flex-col items-center justify-center overflow-hidden bg-canvas px-4 py-12">
      <div className="pointer-events-none absolute inset-0 lime-radial" />
      <div className="pointer-events-none absolute inset-0 grid-bg opacity-[0.35]" />

      <div className="relative mb-8">
        <Link href="/" className="flex items-center gap-2.5">
          <div className="flex h-10 w-10 items-center justify-center rounded-xl bg-accent-lime">
            <Sparkles className="h-5 w-5 text-[var(--accent-ink)]" />
          </div>
          <span className="font-display text-2xl font-semibold tracking-tight text-ink">
            TaskMatch<span className="text-accent">.ai</span>
          </span>
        </Link>
      </div>

      <div className="relative w-full max-w-md">
        <div className="card-glow rounded-3xl border border-line bg-surface p-8">
          {children}
        </div>
      </div>
    </div>
  );
}
