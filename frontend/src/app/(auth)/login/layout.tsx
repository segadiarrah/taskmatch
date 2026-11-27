import { buildPageMetadata } from "@/lib/page-metadata";

export const generateMetadata = () => buildPageMetadata("/login");

export default function LoginLayout({ children }: { children: React.ReactNode }) {
  return children;
}
