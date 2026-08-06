"use client";

import React, { useEffect, useRef, useState } from "react";
import { useTranslation, LOCALES } from "@/lib/i18n";

export function LanguageSwitcher() {
  const { locale, setLocale } = useTranslation();
  const [open, setOpen] = useState(false);
  const ref = useRef<HTMLDivElement>(null);

  useEffect(() => {
    function handleClickOutside(e: MouseEvent) {
      if (ref.current && !ref.current.contains(e.target as Node)) setOpen(false);
    }
    document.addEventListener("mousedown", handleClickOutside);
    return () => document.removeEventListener("mousedown", handleClickOutside);
  }, []);

  const current = LOCALES.find((o) => o.value === locale) ?? LOCALES[0];

  return (
    <div ref={ref} className="relative inline-block text-left">
      <button
        type="button"
        onClick={() => setOpen((prev) => !prev)}
        className="inline-flex items-center gap-1.5 rounded-lg border border-stone-300 bg-white px-3 py-1.5 text-xs font-medium uppercase tracking-widest text-stone-600 transition-colors hover:border-stone-400 hover:text-stone-900 focus:outline-none"
        aria-haspopup="listbox"
        aria-expanded={open}
        aria-label="Select language"
      >
        <span className="text-sm leading-none">{current.flag}</span>
        <span>{current.label}</span>
        <svg
          className={`h-3.5 w-3.5 transition-transform ${open ? "rotate-180" : ""}`}
          viewBox="0 0 20 20"
          fill="currentColor"
          aria-hidden="true"
        >
          <path
            fillRule="evenodd"
            d="M5.22 8.22a.75.75 0 0 1 1.06 0L10 11.94l3.72-3.72a.75.75 0 1 1 1.06 1.06l-4.25 4.25a.75.75 0 0 1-1.06 0L5.22 9.28a.75.75 0 0 1 0-1.06Z"
            clipRule="evenodd"
          />
        </svg>
      </button>

      {open && (
        <ul
          role="listbox"
          className="absolute right-0 z-50 mt-2 w-44 origin-top-right overflow-hidden rounded-xl border border-stone-200 bg-white py-1 shadow-lg"
        >
          {LOCALES.map((opt) => (
            <li
              key={opt.value}
              role="option"
              aria-selected={opt.value === locale}
              className={`flex cursor-pointer items-center gap-3 px-3.5 py-2.5 text-sm transition-colors hover:bg-stone-50 ${
                opt.value === locale ? "text-brand-700" : "text-stone-700"
              }`}
              onClick={() => {
                setLocale(opt.value);
                setOpen(false);
              }}
            >
              <span className="text-base leading-none">{opt.flag}</span>
              <span className="font-medium">{opt.native}</span>
              {opt.value === locale && (
                <span className="ml-auto h-1.5 w-1.5 rounded-full bg-brand-700" />
              )}
            </li>
          ))}
        </ul>
      )}
    </div>
  );
}
