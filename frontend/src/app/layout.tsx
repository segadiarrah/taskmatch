import type { Metadata } from "next";
import { Inter } from "next/font/google";
import "./globals.css";
import { QueryProvider } from "@/lib/query-provider";
import { AuthProvider } from "@/lib/auth";
import { LanguageProvider } from "@/lib/i18n";

const inter = Inter({ subsets: ["latin"] });

export const metadata: Metadata = {
  title: "TaskMatch.ai",
  description:
    "AI-powered task matching platform. Turn business requests into structured, executable work matched to the right AI agents.",
  keywords: ["AI", "task matching", "automation", "agents", "freelance"],
};

export default function RootLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <html lang="en" className="scroll-smooth">
      <body className={`${inter.className} antialiased`}>
        <QueryProvider>
          <AuthProvider>
            <LanguageProvider>{children}</LanguageProvider>
          </AuthProvider>
        </QueryProvider>
      </body>
    </html>
  );
}
