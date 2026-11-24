"use client";

import { useEffect } from "react";
import { usePathname, useSearchParams } from "next/navigation";
import { API_BASE_URL } from "@/lib/api";
import { analyticsAllowed } from "@/lib/analytics-consent";
import { useAuth } from "@/lib/auth";
import { useTranslation } from "@/lib/i18n";
import { PUBLIC_ROUTES } from "@/lib/site";

export function MeasurementObserver() {
  const path = usePathname();
  const query = useSearchParams();
  const { locale } = useTranslation();
  const { user, token } = useAuth();
  useEffect(()=>{
    function send(kind: string, account = false) {
      if (!analyticsAllowed() || (account && !token)) return;
      void fetch(`${API_BASE_URL}/v1/measurement/${account ? "activity" : "events"}`, {
        method:"POST", keepalive:true,
        headers:{"Content-Type":"application/json", ...(account ? { Authorization:`Bearer ${token}` } : {})},
        body:JSON.stringify(account ? {kind} : {kind,language:locale}),
      }).catch(()=>{});
    }
    const publicPage = (PUBLIC_ROUTES as readonly string[]).includes(path)
      || path.startsWith("/resources/") || path.startsWith("/directory/");
    function observe() {
      if (!analyticsAllowed()) return;
      if (publicPage) send("landing_page_view");
      if (user && user.role !== "admin" && /^\/(client|developer|human-tasks)(\/|$)/.test(path)) {
        send("activity", true);
        if (path === "/client/jobs/new" || path === "/developer/agents/new" || (path === "/human-tasks" && query.get("view"))) {
          send("onboarding_started", true);
        }
      }
      const ref = query.get("ref");
      if (publicPage && !localStorage.getItem("auth_token") && ref && /^[\w-]{22}$/.test(ref)) {
        void fetch(`${API_BASE_URL}/v1/measurement/referral`, {method:"POST",headers:{"Content-Type":"application/json"},
          body:JSON.stringify({code:ref})}).catch(()=>{});
      }
    }
    const click = (event: MouseEvent) => {
      const link = event.target instanceof Element ? event.target.closest("a") : null;
      if (publicPage && link && link.origin === location.origin && link.pathname === "/register") send("cta_clicked");
    };
    const start = (event: Event) => {
      if (path === "/register" && event.target instanceof HTMLInputElement && event.target.closest("form")) send("registration_started");
    };
    observe();
    window.addEventListener("taskmatch:usage-preference", observe);
    document.addEventListener("click",click,true);
    document.addEventListener("change",start,true);
    return ()=>{
      window.removeEventListener("taskmatch:usage-preference",observe);
      document.removeEventListener("click",click,true);
      document.removeEventListener("change",start,true);
    };
  },[path,query,locale,user,token]);
  return null;
}
