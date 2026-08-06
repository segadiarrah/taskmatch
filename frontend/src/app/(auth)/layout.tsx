import Link from "next/link";
import { Layers } from "lucide-react";

export default function AuthLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <div className="flex min-h-screen flex-col items-center justify-center bg-stone-50 px-4 py-12">
      <div className="mb-8">
        <Link href="/" className="flex items-center gap-2.5">
          <span className="flex h-9 w-9 items-center justify-center rounded-lg bg-brand-800">
            <Layers className="h-4 w-4 text-white" />
          </span>
          <span className="text-lg font-semibold tracking-tight text-stone-900">
            TaskMatch<span className="text-brand-700">.ai</span>
          </span>
        </Link>
      </div>

      <div className="w-full max-w-md">
        <div className="rounded-xl border border-stone-200 bg-white p-8 shadow-sm">
          {children}
        </div>
      </div>
    </div>
  );
}
