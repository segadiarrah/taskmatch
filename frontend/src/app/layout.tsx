import type { Metadata } from "next";

import { LEGAL_ENTITY } from "@/content/legal-entity";
import { SITE_URL } from "@/lib/site";
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

const SITE_TITLE = "TaskMatch.ai — AI task execution, made accountable";
const SITE_DESCRIPTION =
  "TaskMatch.ai turns a plain-language brief into structured, decomposed, matched, and validated work — with every AI decision on the record.";

/**
 * Site metadata.
 *
 * The page previously declared only a title, a description and keywords: no
 * `metadataBase`, no canonical URL, no Open Graph or Twitter tags, and no
 * explicit indexing directive. A crawler had nothing authoritative to attach
 * the site to, which is why search results describe it so poorly. The
 * `publisher` field and the JSON-LD block below name Tauraco explicitly, so the
 * product is identifiably attached to a real company rather than reading as an
 * unattributed project.
 */
export const metadata: Metadata = {
  metadataBase: new URL(SITE_URL),
  title: SITE_TITLE,
  description: SITE_DESCRIPTION,
  applicationName: "TaskMatch.ai",
  keywords: ["task execution", "AI agents", "orchestration", "task platform", "workflow", "automation"],
  publisher: LEGAL_ENTITY.name,
  creator: LEGAL_ENTITY.name,
  alternates: { canonical: "/" },
  robots: {
    index: true,
    follow: true,
    googleBot: { index: true, follow: true, "max-snippet": -1, "max-image-preview": "large" },
  },
  openGraph: {
    type: "website",
    siteName: "TaskMatch.ai",
    title: SITE_TITLE,
    description: SITE_DESCRIPTION,
    url: SITE_URL,
    locale: "en_US",
    alternateLocale: ["fr_FR", "es_ES", "zh_CN"],
  },
  twitter: {
    card: "summary_large_image",
    title: SITE_TITLE,
    description: SITE_DESCRIPTION,
  },
};

/**
 * Structured data identifying the publisher. This is what lets a search engine
 * state who operates the service instead of guessing.
 */
const organizationJsonLd = {
  "@context": "https://schema.org",
  "@type": "Organization",
  name: "TaskMatch.ai",
  url: SITE_URL,
  description: SITE_DESCRIPTION,
  parentOrganization: {
    "@type": "Organization",
    name: LEGAL_ENTITY.name,
    address: { "@type": "PostalAddress", addressCountry: "FR" },
  },
  contactPoint: {
    "@type": "ContactPoint",
    contactType: "customer support",
    email: LEGAL_ENTITY.email.legal,
    areaServed: "Worldwide",
  },
};

export default function RootLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <html lang="en" className="scroll-smooth">
      <head>
        <script
          type="application/ld+json"
          // Structured data is a static, developer-authored object — no user
          // input reaches it.
          dangerouslySetInnerHTML={{ __html: JSON.stringify(organizationJsonLd) }}
        />
      </head>
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
