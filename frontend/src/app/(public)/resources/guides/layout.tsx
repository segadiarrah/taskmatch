import type { ReactNode } from "react";

import { buildPageMetadata } from "@/lib/page-metadata";

/**
 * The page itself is a client component and cannot export metadata, so the
 * title, description and canonical URL for this route are declared here.
 */
export const generateMetadata = () => buildPageMetadata("/resources/guides");

export default function GuidesLayout({ children }: { children: ReactNode }) {
  return children;
}
