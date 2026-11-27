import { headers } from "next/headers";
import { requestLanguage } from "@/lib/request-locale";
import { parsePublicIntent, authIntentHref } from "@/lib/public-intent";
import { registerPreview, shareMetadata } from "@/lib/share-metadata";
import { COPY } from "@/lib/landing-copy";

const javascriptNotice = {
  en: "Enable JavaScript in your browser, then reload this page to create your account.",
  fr: "Activez JavaScript dans votre navigateur, puis rechargez cette page pour créer votre compte.",
  zh: "请在浏览器中启用 JavaScript，然后重新加载此页面以创建账户。",
  es: "Activa JavaScript en tu navegador y vuelve a cargar esta página para crear tu cuenta.",
  pt: "Ative o JavaScript no seu navegador e recarregue esta página para criar a sua conta.",
};

async function registrationContext() {
  const { locale } = await requestLanguage();
  const intent = parsePublicIntent((await headers()).get("x-taskmatch-intent"));
  return { locale, intent };
}

export async function generateMetadata() {
  const { locale, intent } = await registrationContext();
  return { ...shareMetadata(authIntentHref("register", intent), locale, registerPreview(locale, intent)), robots: { index: false, follow: true } };
}

export default async function RegisterLayout({ children }: { children: React.ReactNode }) {
  const { locale, intent } = await registrationContext();
  return <>
    <noscript>
      <h1 className="font-display text-3xl font-medium text-ink-50">{intent ? COPY[locale][intent] : "TaskMatch.ai"}</h1>
      <p className="mt-2 text-sm text-ink-300">{javascriptNotice[locale]}</p>
    </noscript>
    {children}
  </>;
}
