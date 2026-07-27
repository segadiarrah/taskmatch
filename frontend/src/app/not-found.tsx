import Link from "next/link";

export default function NotFound() {
  return (
    <div className="flex min-h-screen items-center justify-center bg-[#f7f3ec] px-4">
      <div className="relative w-full max-w-lg overflow-hidden rounded-[2rem] border border-stone-900/10 bg-white/80 p-10 text-center shadow-[0_20px_50px_rgba(92,74,44,0.08)]">
        <div className="font-display text-7xl leading-none text-[#8a6a2f]">404</div>
        <h1 className="mt-6 font-display text-3xl text-stone-950">This page took a wrong turn.</h1>
        <p className="mt-4 text-sm leading-7 text-stone-600">
          The page you were looking for doesn&rsquo;t exist or may have moved. Let&rsquo;s get you
          back to somewhere useful.
        </p>
        <div className="mt-8 flex flex-col items-center justify-center gap-3 sm:flex-row">
          <Link
            href="/"
            className="inline-flex h-12 items-center justify-center rounded-full bg-stone-950 px-7 text-sm font-semibold text-white transition-colors hover:bg-stone-800"
          >
            Back to home
          </Link>
          <Link
            href="/resources/documentation"
            className="inline-flex h-12 items-center justify-center rounded-full border border-stone-900/12 bg-white/70 px-7 text-sm font-semibold text-stone-950 transition-colors hover:bg-white"
          >
            Read the docs
          </Link>
        </div>
      </div>
    </div>
  );
}
