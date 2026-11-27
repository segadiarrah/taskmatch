import "server-only";
import { cache } from "react";
import { notFound } from "next/navigation";
import type { PublicDirectoryCard } from "@/lib/directory-copy";

const base = (process.env.API_INTERNAL_URL ?? "http://localhost:8000").replace(/\/$/, "") + "/api/v1/directory";

export const readPublicProfile = cache(async (id: string): Promise<PublicDirectoryCard> => {
  if (!/^[0-9a-f]{8}(?:-[0-9a-f]{4}){3}-[0-9a-f]{12}$/i.test(id)) notFound();
  const res = await fetch(base + "/" + id, { cache: "no-store", signal: AbortSignal.timeout(5000) });
  if (res.status === 404) notFound();
  if (!res.ok) throw new Error("Directory unavailable");
  return res.json();
});

export async function readDirectory(params: URLSearchParams): Promise<{ items: PublicDirectoryCard[]; has_more: boolean } | null> {
  try {
    const res = await fetch(base + "?" + params, { cache: "no-store", signal: AbortSignal.timeout(5000) });
    if (res.ok) return await res.json();
  } catch { /* Render a localized temporary failure. */ }
  return null;
}
