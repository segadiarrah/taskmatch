import React from "react";
import { PublicFooter, PublicNavbar } from "@/components/public/site-chrome";

export default function PublicLayout({ children }: { children: React.ReactNode }) {
  return (
    <div className="min-h-screen bg-ink-950 text-ink-50">
      <PublicNavbar />
      <main className="pt-16">{children}</main>
      <PublicFooter />
    </div>
  );
}
