import type { Config } from "tailwindcss";

const config: Config = {
  content: [
    "./pages/**/*.{js,ts,jsx,tsx,mdx}",
    "./components/**/*.{js,ts,jsx,tsx,mdx}",
    "./app/**/*.{js,ts,jsx,tsx,mdx}",
  ],
  theme: {
    extend: {
      colors: {
        brand: {
          50: "#f0f6ff",
          100: "#e0edff",
          200: "#bae0fd",
          300: "#7dc3fc",
          400: "#388dfa",
          500: "#195adc", // Electric Royal Blue
          600: "#1246b8",
          700: "#0e3896",
          800: "#0a266b", // Razorpay Navy
          900: "#09090b", // Deep Ink
          950: "#050507",
        },
        surface: {
          50: "#fafbfc",
          100: "#f4f5f7",
          200: "#e5e7eb", // Architectural Border
          300: "#d1d5db",
          400: "#9ca3af",
          500: "#6b7280",
          600: "#475467", // High legibility body ink
          700: "#374151",
          800: "#1f2937",
          900: "#09090b", // Primary Text Ink
        },
        razorpay: {
          blue: "#0052ff",
          dark: "#0c2340",
          light: "#eaf2ff",
        },
        settlement: {
          50: "#ecfdf5",
          100: "#d1fae5",
          500: "#10b981",
          600: "#059669",
          700: "#047857",
        },
      },
      fontFamily: {
        sans: ["var(--font-sans)", "Inter", "-apple-system", "BlinkMacSystemFont", "sans-serif"],
        display: ["var(--font-display)", "Plus Jakarta Sans", "Inter", "sans-serif"],
        mono: ["var(--font-mono)", "JetBrains Mono", "Menlo", "monospace"],
      },
      borderRadius: {
        "3xl": "1.5rem",
        "2xl": "1rem",
        xl: "0.75rem",
        lg: "0.5rem",
        md: "0.375rem",
        sm: "0.25rem",
        pill: "9999px",
      },
      boxShadow: {
        none: "none",
        "2xs": "0 1px 2px 0 rgba(0, 0, 0, 0.03)",
        xs: "0 1px 3px 0 rgba(0, 0, 0, 0.05), 0 1px 2px -1px rgba(0, 0, 0, 0.05)",
        subtle: "0 2px 8px -2px rgba(12, 35, 64, 0.06), 0 1px 4px -1px rgba(0, 0, 0, 0.04)",
        card: "0 4px 20px -2px rgba(12, 35, 64, 0.05), 0 2px 6px -1px rgba(0, 0, 0, 0.02)",
        "card-hover": "0 12px 32px -4px rgba(25, 90, 220, 0.08), 0 4px 12px -2px rgba(0, 0, 0, 0.04)",
        popover: "0 16px 40px -8px rgba(12, 35, 64, 0.12), 0 6px 16px -4px rgba(0, 0, 0, 0.04)",
        "glow-blue": "0 0 24px -4px rgba(25, 90, 220, 0.25)",
        "glow-emerald": "0 0 24px -4px rgba(16, 185, 129, 0.25)",
      },
    },
  },
  plugins: [],
};

export default config;

