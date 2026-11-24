import type { ReactNode } from "react";
import { buildPageMetadata } from "@/lib/page-metadata";

export const generateMetadata = () => buildPageMetadata("/directory");

export default function DirectoryLayout({ children }: { children: ReactNode }) {
  return children;
}
