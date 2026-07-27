import type { Metadata } from "next";
import dynamic from "next/dynamic";
import { Fraunces, Manrope } from "next/font/google";
import "./globals.css";
import { QueryProvider } from "@/lib/query-provider";
import { AuthProvider } from "@/lib/auth";
import { LanguageProvider } from "@/lib/i18n";

const CookieBanner = dynamic(
  () => import("@/components/gdpr/cookie-banner").then((m) => m.CookieBanner),
  { ssr: false }
);

const manrope = Manrope({
  subsets: ["latin"],
  variable: "--font-sans",
});

const fraunces = Fraunces({
  subsets: ["latin"],
  variable: "--font-display",
});

export const metadata: Metadata = {
  title: "TaskMatch.ai",
  description:
    "A modern task execution platform that helps teams describe a need, structure the request, and move work through a clearer delivery flow.",
  keywords: ["task execution", "task platform", "workflow", "agents", "automation"],
};

export default function RootLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <html lang="en" className="scroll-smooth">
      <body className={`${manrope.variable} ${fraunces.variable} font-sans antialiased`}>
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
