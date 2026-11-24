import { headers } from "next/headers";
import { requestLanguage } from "@/lib/request-locale";
import { parsePublicIntent, authIntentHref } from "@/lib/public-intent";
import { registerPreview, shareMetadata } from "@/lib/share-metadata";

export async function generateMetadata() {
  const { locale } = await requestLanguage();
  const intent = parsePublicIntent((await headers()).get("x-taskmatch-intent"));
  return { ...shareMetadata(authIntentHref("register", intent), locale, registerPreview(locale, intent)), robots: { index: false, follow: true } };
}

export default function RegisterLayout({ children }: { children: React.ReactNode }) {
  return children;
}
