"use client";

import React, { useState, useEffect, useCallback } from "react";
import Link from "next/link";
import { Cookie, Settings, X } from "lucide-react";
import { Button } from "@/components/ui/button";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogDescription,
  DialogFooter,
  DialogClose,
} from "@/components/ui/dialog";
import { cn } from "@/lib/utils";

/* -------------------------------------------------------------------------- */
/*  Types                                                                     */
/* -------------------------------------------------------------------------- */

interface CookieConsent {
  necessary: boolean;
  analytics: boolean;
  marketing: boolean;
  timestamp: string;
}

const STORAGE_KEY = "tm_cookie_consent";

/* -------------------------------------------------------------------------- */
/*  Toggle switch                                                             */
/* -------------------------------------------------------------------------- */

function Toggle({
  enabled,
  disabled,
  onChange,
}: {
  enabled: boolean;
  disabled?: boolean;
  onChange: (value: boolean) => void;
}) {
  return (
    <button
      role="switch"
      aria-checked={enabled}
      disabled={disabled}
      onClick={() => onChange(!enabled)}
      className={cn(
        "relative inline-flex h-6 w-11 shrink-0 cursor-pointer rounded-full border-2 border-transparent transition-colors duration-200 ease-in-out focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-brand-700 focus-visible:ring-offset-2",
        enabled ? "bg-brand-800" : "bg-stone-300",
        disabled && "opacity-60 cursor-not-allowed"
      )}
    >
      <span
        className={cn(
          "pointer-events-none inline-block h-5 w-5 transform rounded-full bg-white shadow-sm ring-0 transition duration-200 ease-in-out",
          enabled ? "translate-x-5" : "translate-x-0"
        )}
      />
    </button>
  );
}

/* -------------------------------------------------------------------------- */
/*  Cookie category row                                                       */
/* -------------------------------------------------------------------------- */

function CookieCategory({
  name,
  description,
  enabled,
  disabled,
  onChange,
}: {
  name: string;
  description: string;
  enabled: boolean;
  disabled?: boolean;
  onChange: (value: boolean) => void;
}) {
  return (
    <div className="flex items-start justify-between gap-4 py-3">
      <div className="flex-1">
        <div className="flex items-center gap-2">
          <span className="text-sm font-medium text-stone-900">{name}</span>
          {disabled && (
            <span className="text-xs text-stone-500 bg-stone-100 rounded px-1.5 py-0.5">
              Always on
            </span>
          )}
        </div>
        <p className="text-xs text-stone-500 mt-0.5">{description}</p>
      </div>
      <Toggle enabled={enabled} disabled={disabled} onChange={onChange} />
    </div>
  );
}

/* -------------------------------------------------------------------------- */
/*  Cookie Banner                                                             */
/* -------------------------------------------------------------------------- */

export function CookieBanner() {
  const [visible, setVisible] = useState(false);
  const [customizeOpen, setCustomizeOpen] = useState(false);
  const [preferences, setPreferences] = useState<CookieConsent>({
    necessary: true,
    analytics: false,
    marketing: false,
    timestamp: "",
  });

  /* Check for existing consent on mount */
  useEffect(() => {
    try {
      const stored = localStorage.getItem(STORAGE_KEY);
      if (stored) {
        const parsed: CookieConsent = JSON.parse(stored);
        if (parsed.timestamp) {
          /* Consent already given -- don't show banner */
          setPreferences(parsed);
          return;
        }
      }
    } catch {
      /* Invalid or missing -- show banner */
    }
    /* Small delay so the banner animates in */
    const timer = setTimeout(() => setVisible(true), 800);
    return () => clearTimeout(timer);
  }, []);

  /* Save consent to localStorage */
  const saveConsent = useCallback((consent: CookieConsent) => {
    const withTimestamp: CookieConsent = {
      ...consent,
      necessary: true, // always true
      timestamp: new Date().toISOString(),
    };
    try {
      localStorage.setItem(STORAGE_KEY, JSON.stringify(withTimestamp));
    } catch {
      /* localStorage may be unavailable */
    }
    setPreferences(withTimestamp);
    setVisible(false);
    setCustomizeOpen(false);
  }, []);

  const handleAcceptAll = useCallback(() => {
    saveConsent({ necessary: true, analytics: true, marketing: true, timestamp: "" });
  }, [saveConsent]);

  const handleRejectAll = useCallback(() => {
    saveConsent({ necessary: true, analytics: false, marketing: false, timestamp: "" });
  }, [saveConsent]);

  const handleSavePreferences = useCallback(() => {
    saveConsent(preferences);
  }, [preferences, saveConsent]);

  /* Don't render anything if consent already given */
  if (!visible && !customizeOpen) return null;

  return (
    <>
      {/* Bottom banner */}
      {visible && !customizeOpen && (
        <div
          className="fixed bottom-0 inset-x-0 z-50 animate-in slide-in-from-bottom duration-300"
          role="dialog"
          aria-label="Cookie consent"
        >
          <div className="border-t border-stone-200 bg-white shadow-lg">
            <div className="mx-auto max-w-5xl px-4 py-4 sm:px-6">
              <div className="flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
                {/* Message */}
                <div className="flex items-start gap-3 flex-1">
                  <Cookie className="h-5 w-5 text-stone-500 mt-0.5 shrink-0" />
                  <div>
                    <p className="text-sm text-stone-700">
                      We use cookies to enhance your experience, analyze
                      platform usage, and support our marketing efforts. You can
                      customize your preferences or accept/reject all cookies.
                    </p>
                    <Link
                      href="/legal/compliance#cookie-policy"
                      className="text-xs text-stone-500 hover:text-stone-900 underline mt-1 inline-block"
                    >
                      Read our Cookie Policy
                    </Link>
                  </div>
                </div>

                {/* Buttons */}
                <div className="flex items-center gap-2 shrink-0">
                  <Button
                    variant="outline"
                    size="sm"
                    onClick={handleRejectAll}
                  >
                    Reject All
                  </Button>
                  <Button
                    variant="outline"
                    size="sm"
                    onClick={() => {
                      setCustomizeOpen(true);
                    }}
                    className="gap-1.5"
                  >
                    <Settings className="h-3.5 w-3.5" />
                    Customize
                  </Button>
                  <Button size="sm" onClick={handleAcceptAll}>
                    Accept All
                  </Button>
                </div>
              </div>
            </div>
          </div>
        </div>
      )}

      {/* Customize modal */}
      <Dialog open={customizeOpen} onOpenChange={setCustomizeOpen}>
        <DialogContent className="max-w-md">
          <DialogClose onClick={() => setCustomizeOpen(false)} />
          <DialogHeader>
            <DialogTitle>Cookie Preferences</DialogTitle>
            <DialogDescription>
              Choose which cookies you&apos;d like to allow. Necessary cookies
              cannot be disabled as they are required for the platform to
              function.
            </DialogDescription>
          </DialogHeader>

          <div className="divide-y divide-stone-100">
            <CookieCategory
              name="Necessary Cookies"
              description="Required for authentication, security, and core platform functionality. These cookies cannot be disabled."
              enabled={true}
              disabled={true}
              onChange={() => {}}
            />
            <CookieCategory
              name="Analytics Cookies"
              description="Help us understand how visitors interact with the platform by collecting anonymized usage data."
              enabled={preferences.analytics}
              onChange={(val) =>
                setPreferences((prev) => ({ ...prev, analytics: val }))
              }
            />
            <CookieCategory
              name="Marketing Cookies"
              description="Used to measure the effectiveness of marketing campaigns and display relevant content."
              enabled={preferences.marketing}
              onChange={(val) =>
                setPreferences((prev) => ({ ...prev, marketing: val }))
              }
            />
          </div>

          <DialogFooter>
            <Button variant="outline" onClick={handleRejectAll}>
              Reject All
            </Button>
            <Button onClick={handleSavePreferences}>Save Preferences</Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </>
  );
}

export default CookieBanner;
