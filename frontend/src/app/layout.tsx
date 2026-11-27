import { Suspense } from "react";
import { MeasurementObserver } from "@/components/measurement-observer";
import { RouteMetadata } from "@/components/localized-metadata";
import type { Metadata } from "next";

import { LEGAL_ENTITY } from "@/lib/legal-entity";
import { serializeJsonLd } from "@/lib/json-ld";
import { getLocalizedRouteMetadata } from "@/lib/localized-page-copy";
import { requestLanguage } from "@/lib/request-locale";
import { SITE_URL } from "@/lib/site";
import { DM_Sans, IBM_Plex_Mono, Manrope } from "next/font/google";
import "./globals.css";
import { QueryProvider } from "@/lib/query-provider";
import { AuthProvider } from "@/lib/auth";
import { LanguageProvider } from "@/lib/i18n";

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

export async function generateMetadata(): Promise<Metadata> {
  const { locale } = await requestLanguage();
  const copy = getLocalizedRouteMetadata("/", locale);
  return {
    metadataBase: new URL(SITE_URL),
    ...copy,
    applicationName: "TaskMatch.ai",
    publisher: LEGAL_ENTITY.name,
    creator: LEGAL_ENTITY.name,
    keywords: ["task execution", "AI agents", "orchestration", "task platform", "workflow", "automation"],
    robots: {
      index: true, follow: true,
      googleBot: { index: true, follow: true, "max-snippet": -1, "max-image-preview": "large" },
    },
    openGraph: { ...copy, type: "website", siteName: "TaskMatch.ai" },
    twitter: { ...copy, card: "summary_large_image" },
  };
}

/**
 * Structured data identifying the publisher. This is what lets a search engine
 * state who operates the service instead of guessing.
 */
const organizationJsonLd = {
  "@context": "https://schema.org",
  "@type": "Organization",
  name: "TaskMatch.ai",
  url: SITE_URL,
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

export default async function RootLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  const { locale, explicit } = await requestLanguage();
  return (
    <html lang={locale} className="scroll-smooth">
      <head>
        <script
          type="application/ld+json"
          dangerouslySetInnerHTML={{ __html: serializeJsonLd({ ...organizationJsonLd, description: getLocalizedRouteMetadata("/", locale).description }) }}
        />
      </head>
      <body
        className={`${dmSans.variable} ${manrope.variable} ${ibmPlexMono.variable} font-sans antialiased`}
      >
        <QueryProvider>
          <AuthProvider>
            <LanguageProvider initialLocale={locale} explicit={explicit}>
              <Suspense fallback={null}><RouteMetadata /><MeasurementObserver /></Suspense>
              {children}
            </LanguageProvider>
          </AuthProvider>
        </QueryProvider>
      </body>
    </html>
  );
}
