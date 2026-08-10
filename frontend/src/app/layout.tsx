import type { Metadata } from "next";
import dynamic from "next/dynamic";
import { Archivo, Fraunces, JetBrains_Mono } from "next/font/google";
import "./globals.css";
import { QueryProvider } from "@/lib/query-provider";
import { AuthProvider } from "@/lib/auth";
import { LanguageProvider } from "@/lib/i18n";

const CookieBanner = dynamic(
  () => import("@/components/gdpr/cookie-banner").then((m) => m.CookieBanner),
  { ssr: false }
);

const archivo = Archivo({
  subsets: ["latin"],
  variable: "--font-sans",
});

const fraunces = Fraunces({
  subsets: ["latin"],
  variable: "--font-display",
  axes: ["opsz"],
});

const jetbrainsMono = JetBrains_Mono({
  subsets: ["latin"],
  variable: "--font-mono",
});

export const metadata: Metadata = {
  title: "TaskMatch.ai — AI task execution, made accountable",
  description:
    "TaskMatch.ai turns a plain-language brief into structured, decomposed, matched, and validated work — with every AI decision on the record.",
  keywords: ["task execution", "AI agents", "orchestration", "task platform", "workflow", "automation"],
};

export default function RootLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <html lang="en" className="scroll-smooth">
      <body
        className={`${archivo.variable} ${fraunces.variable} ${jetbrainsMono.variable} font-sans antialiased`}
      >
        <QueryProvider>
          <AuthProvider>
            <LanguageProvider>
              {children}
              <CookieBanner />
            </LanguageProvider>
          </AuthProvider>
        </QueryProvider>
      </body>
    </html>
  );
}
