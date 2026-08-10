import type { Config } from "tailwindcss";

/**
 * TaskMatch design system — "Dispatch Ledger"
 * Dark mission-control console (warm ink) + editorial paper sections,
 * signal-orange accents, Fraunces display serif / Archivo UI / JetBrains Mono data.
 */
const config: Config = {
  darkMode: ["class"],
  content: ["./src/**/*.{ts,tsx}"],
  theme: {
    extend: {
      colors: {
        /* Semantic tokens (CSS vars, alpha-aware) */
        border: "hsl(var(--border) / <alpha-value>)",
        input: "hsl(var(--input) / <alpha-value>)",
        ring: "hsl(var(--ring) / <alpha-value>)",
        background: "hsl(var(--background) / <alpha-value>)",
        foreground: "hsl(var(--foreground) / <alpha-value>)",
        primary: {
          DEFAULT: "hsl(var(--primary) / <alpha-value>)",
          foreground: "hsl(var(--primary-foreground) / <alpha-value>)",
        },
        secondary: {
          DEFAULT: "hsl(var(--secondary) / <alpha-value>)",
          foreground: "hsl(var(--secondary-foreground) / <alpha-value>)",
        },
        destructive: {
          DEFAULT: "hsl(var(--destructive) / <alpha-value>)",
          foreground: "hsl(var(--destructive-foreground) / <alpha-value>)",
        },
        muted: {
          DEFAULT: "hsl(var(--muted) / <alpha-value>)",
          foreground: "hsl(var(--muted-foreground) / <alpha-value>)",
        },
        accent: {
          DEFAULT: "hsl(var(--accent) / <alpha-value>)",
          foreground: "hsl(var(--accent-foreground) / <alpha-value>)",
        },
        card: {
          DEFAULT: "hsl(var(--card) / <alpha-value>)",
          foreground: "hsl(var(--card-foreground) / <alpha-value>)",
        },
        /* Status colors tuned for dark surfaces */
        success: "hsl(var(--success) / <alpha-value>)",
        warning: "hsl(var(--warning) / <alpha-value>)",
        info: "hsl(var(--info) / <alpha-value>)",
        danger: "hsl(var(--danger) / <alpha-value>)",

        /* Warm near-black console scale */
        ink: {
          50: "#f1f2e8",
          100: "#e7e9db",
          200: "#d6dac7",
          300: "#b4bba4",
          400: "#8b927c",
          500: "#848c77",
          600: "#3e4430",
          700: "#2a2e20",
          800: "#1d2016",
          850: "#161810",
          900: "#12130e",
          950: "#0b0b09",
        },
        /* Signal orange — the dispatch accent */
        signal: {
          300: "#ffb591",
          400: "#ff8552",
          500: "#ff5a1f",
          600: "#e84a0e",
          700: "#bc3b0c",
        },
        /* Warm editorial paper */
        paper: {
          DEFAULT: "#ede8d9",
          deep: "#e2dcc8",
          ink: "#191b12",
        },
        /* Legacy alias — maps old brand-* classes onto signal so nothing breaks */
        brand: {
          50: "#fff4ec",
          100: "#ffe6d5",
          200: "#ffc9a8",
          300: "#ffb591",
          400: "#ff8552",
          500: "#ff5a1f",
          600: "#e84a0e",
          700: "#bc3b0c",
          800: "#93300b",
          900: "#6e250a",
          950: "#3d1404",
        },
      },
      fontFamily: {
        sans: ["var(--font-sans)", "ui-sans-serif", "system-ui", "sans-serif"],
        display: ["var(--font-display)", "Georgia", "serif"],
        mono: ["var(--font-mono)", "ui-monospace", "monospace"],
      },
      borderRadius: {
        lg: "var(--radius)",
        md: "calc(var(--radius) - 2px)",
        sm: "calc(var(--radius) - 4px)",
      },
      boxShadow: {
        panel: "0 1px 0 0 rgba(241,242,232,0.04) inset, 0 12px 32px -12px rgba(0,0,0,0.6)",
        glow: "0 0 0 1px rgba(255,90,31,0.35), 0 0 24px -6px rgba(255,90,31,0.45)",
        "glow-sm": "0 0 14px -2px rgba(255,90,31,0.5)",
      },
      keyframes: {
        marquee: {
          "0%": { transform: "translateX(0)" },
          "100%": { transform: "translateX(-50%)" },
        },
        blink: {
          "0%, 100%": { opacity: "1" },
          "50%": { opacity: "0" },
        },
        scan: {
          "0%": { transform: "translateY(-100%)" },
          "100%": { transform: "translateY(400%)" },
        },
        "pulse-dot": {
          "0%, 100%": { opacity: "1", boxShadow: "0 0 0 0 rgba(255,90,31,0.5)" },
          "50%": { opacity: "0.75", boxShadow: "0 0 0 5px rgba(255,90,31,0)" },
        },
      },
      animation: {
        marquee: "marquee 36s linear infinite",
        blink: "blink 1.1s step-end infinite",
        scan: "scan 3.2s ease-in-out infinite",
        "pulse-dot": "pulse-dot 1.8s ease-in-out infinite",
      },
    },
  },
  plugins: [],
};
export default config;
