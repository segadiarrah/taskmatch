"use client";

import Link from "next/link";
import { useSearchParams } from "next/navigation";
import type { ComponentProps } from "react";
import { normalizeLocale } from "@/lib/locales";

export default function LocalizedLink({ href, ...props }: ComponentProps<typeof Link>) {
  const params = useSearchParams();
  const locale = normalizeLocale(params.get("lang"));
  if (locale && typeof href === "string" && /^\/(?!\/)/.test(href)) {
    const target = new URL(href, "https://taskmatch.ai");
    target.searchParams.set("lang", locale);
    href = target.pathname + target.search + target.hash;
  }
  return <Link {...props} href={href} />;
}
