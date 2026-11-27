import { buildPageMetadata } from "@/lib/page-metadata";
import { JourneyPage } from "@/components/public/journey-page";
import { PublicFooter, PublicNavbar } from "@/components/public/site-chrome";

export const generateMetadata = () => buildPageMetadata("/");

export default function LandingPage() {
  return <><PublicNavbar /><main><JourneyPage /></main><PublicFooter /></>;
}
