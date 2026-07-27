export default function Loading() {
  return (
    <div className="flex min-h-screen items-center justify-center bg-[#f7f3ec] px-4">
      <div className="flex flex-col items-center gap-6 text-center">
        <div className="relative flex h-14 w-14 items-center justify-center">
          <span className="absolute inline-flex h-full w-full animate-ping rounded-full bg-[#8a6a2f]/20" />
          <span className="relative inline-flex h-10 w-10 animate-spin rounded-full border-2 border-[#8a6a2f]/25 border-t-[#8a6a2f]" />
        </div>
        <div>
          <div className="font-display text-2xl text-stone-950">Loading</div>
          <p className="mt-2 text-sm text-stone-600">Preparing your view&hellip;</p>
        </div>
      </div>
    </div>
  );
}
