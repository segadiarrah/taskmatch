"use client";

import React, { useEffect, useRef, useState } from "react";
import { useTranslation, type Locale } from "@/lib/i18n";

const options: { value: Locale; flag: string; label: string }[] = [
  { value: "en", flag: "\ud83c\uddec\ud83c\udde7", label: "EN" },
  { value: "fr", flag: "\ud83c\uddeb\ud83c\uddf7", label: "FR" },
];

export function LanguageSwitcher() {
  const { locale, setLocale } = useTranslation();
  const [open, setOpen] = useState(false);
  const ref = useRef<HTMLDivElement>(null);

  /* Close dropdown on outside click. */
  useEffect(() => {
    function handleClickOutside(e: MouseEvent) {
      if (ref.current && !ref.current.contains(e.target as Node)) {
        setOpen(false);
      }
    }
    document.addEventListener("mousedown", handleClickOutside);
    return () => document.removeEventListener("mousedown", handleClickOutside);
  }, []);

  const current = options.find((o) => o.value === locale) ?? options[0];

  return (
    <div ref={ref} className="relative inline-block text-left">
      <button
        type="button"
        onClick={() => setOpen((prev) => !prev)}
        className="inline-flex items-center gap-1.5 rounded-md border border-gray-200 bg-white px-2.5 py-1.5 text-sm font-medium text-gray-700 shadow-sm transition-colors hover:bg-gray-50 focus:outline-none focus:ring-2 focus:ring-indigo-500 focus:ring-offset-1"
        aria-haspopup="listbox"
        aria-expanded={open}
        aria-label="Select language"
      >
        <span className="text-base leading-none">{current.flag}</span>
        <span>{current.label}</span>
        <svg
          className={`h-4 w-4 text-gray-400 transition-transform ${open ? "rotate-180" : ""}`}
          xmlns="http://www.w3.org/2000/svg"
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
          aria-activedescendant={`lang-${locale}`}
          className="absolute right-0 z-50 mt-1 w-28 origin-top-right rounded-md border border-gray-200 bg-white py-1 shadow-lg ring-1 ring-black/5 focus:outline-none"
        >
          {options.map((opt) => (
            <li
              key={opt.value}
              id={`lang-${opt.value}`}
              role="option"
              aria-selected={opt.value === locale}
              className={`flex cursor-pointer items-center gap-2 px-3 py-2 text-sm transition-colors hover:bg-indigo-50 ${
                opt.value === locale
                  ? "font-semibold text-indigo-600"
                  : "text-gray-700"
              }`}
              onClick={() => {
                setLocale(opt.value);
                setOpen(false);
              }}
            >
              <span className="text-base leading-none">{opt.flag}</span>
              <span>{opt.label}</span>
            </li>
          ))}
        </ul>
      )}
    </div>
  );
}
