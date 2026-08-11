import type { Config } from "tailwindcss";

/**
 * TaskMatch design system — "TaskMatch Router"
 * Quiet near-white surfaces, graphite type, restrained violet actions,
 * and precise data-dense components inspired by modern routing consoles.
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
        /* Status colors tuned for light surfaces */
        success: "hsl(var(--success) / <alpha-value>)",
        warning: "hsl(var(--warning) / <alpha-value>)",
        info: "hsl(var(--info) / <alpha-value>)",
        danger: "hsl(var(--danger) / <alpha-value>)",

        /* Graphite-to-canvas scale (names retained for class compatibility) */
        ink: {
          50: "#111113",
          100: "#1d1d21",
          200: "#29292f",
          300: "#3f4047",
          400: "#505159",
          500: "#5c5d65",
          600: "#91929a",
          700: "#c9cad0",
          800: "#e5e5e9",
          850: "#eeeef1",
          900: "#f6f6f8",
          950: "#fbfbfd",
        },
        /* Router violet — used only for actions, focus, and live state */
        signal: {
          300: "#8d78ff",
          400: "#5c3bd7",
          500: "#6340e8",
          600: "#5734de",
          700: "#4326b5",
        },
        /* Secondary editorial surface */
        paper: {
          DEFAULT: "#f7f7f9",
          deep: "#efeff3",
          ink: "#18181b",
        },
        /* Legacy alias — maps old brand-* classes onto violet so nothing breaks */
        brand: {
          50: "#f5f2ff",
          100: "#ebe5ff",
          200: "#d7ccff",
          300: "#bbaaff",
          400: "#8d78ff",
          500: "#6340e8",
          600: "#5734de",
          700: "#4326b5",
          800: "#35208d",
          900: "#2c1d70",
          950: "#190e47",
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
        panel: "0 1px 2px rgba(17, 17, 19, 0.04), 0 8px 24px rgba(17, 17, 19, 0.04)",
        glow: "0 0 0 1px rgba(109,74,255,0.22), 0 10px 30px -12px rgba(109,74,255,0.28)",
        "glow-sm": "0 6px 18px -8px rgba(109,74,255,0.45)",
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
          "0%, 100%": { opacity: "1", boxShadow: "0 0 0 0 rgba(109,74,255,0.35)" },
          "50%": { opacity: "0.75", boxShadow: "0 0 0 5px rgba(109,74,255,0)" },
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
