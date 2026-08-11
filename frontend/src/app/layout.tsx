import type { Metadata } from "next";
import dynamic from "next/dynamic";
import { DM_Sans, IBM_Plex_Mono, Manrope } from "next/font/google";
import "./globals.css";
import { QueryProvider } from "@/lib/query-provider";
import { AuthProvider } from "@/lib/auth";
import { LanguageProvider } from "@/lib/i18n";

const CookieBanner = dynamic(
  () => import("@/components/gdpr/cookie-banner").then((m) => m.CookieBanner),
  { ssr: false }
);

const dmSans = DM_Sans({
  subsets: ["latin"],
  variable: "--font-sans",
});

const manrope = Manrope({
  subsets: ["latin"],
  variable: "--font-display",
});

const ibmPlexMono = IBM_Plex_Mono({
  subsets: ["latin"],
  weight: ["400", "500", "600"],
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
        className={`${dmSans.variable} ${manrope.variable} ${ibmPlexMono.variable} font-sans antialiased`}
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
