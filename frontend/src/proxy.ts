import { NextRequest, NextResponse } from "next/server";
import { parsePublicIntent } from "@/lib/public-intent";
import { normalizeLocale, resolveLocale } from "@/lib/locales";

export function proxy(request: NextRequest) {
  const requested = normalizeLocale(request.nextUrl.searchParams.get("lang"));
  const cookie = normalizeLocale(request.cookies.get("taskmatch_locale")?.value);
  const preferences = (request.headers.get("accept-language") ?? "").split(",")
    .map(entry => {
      const [lang, weight] = entry.trim().split(/;\s*q=/i);
      return { lang, weight: weight === undefined ? 1 : Number(weight) };
    })
    .filter(entry => entry.weight > 0 && entry.weight <= 1)
    .sort((a, b) => b.weight - a.weight).map(entry => entry.lang);
  const headers = new Headers(request.headers);
  headers.set("x-taskmatch-intent", parsePublicIntent(request.nextUrl.searchParams.get("intent")) ?? "");
  headers.set("x-taskmatch-language", requested ?? resolveLocale(cookie, preferences));
  headers.set("x-taskmatch-preference", requested || cookie ? "explicit" : "browser");
  const response = NextResponse.next({ request: { headers } });
  if (requested && requested !== cookie && !request.headers.has("rsc") && !request.headers.has("next-router-prefetch")) {
    response.cookies.set("taskmatch_locale", requested, { path: "/", sameSite: "lax", maxAge: 31536000 });
  }
  return response;
}

export const config = { matcher: ["/((?!api/|_next/|.*\\.[^/]+$).*)"] };
