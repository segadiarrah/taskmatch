import type { ReactNode } from "react";

import { buildPageMetadata } from "@/lib/page-metadata";

/**
 * The page itself is a client component and cannot export metadata, so the
 * title, description and canonical URL for this route are declared here.
 */
export const generateMetadata = () => buildPageMetadata("/how-it-works");

export default function HowItWorksLayout({ children }: { children: ReactNode }) {
  return children;
}
