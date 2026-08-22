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
        sans: ["var(--font-sans)", "Google Sans Flex", "Figtree", "-apple-system", "BlinkMacSystemFont", "sans-serif"],
        display: ["var(--font-display)", "Figtree", "Google Sans Flex", "-apple-system", "BlinkMacSystemFont", "sans-serif"],
        mono: ["var(--font-mono)", "JetBrains Mono", "Menlo", "monospace"],
        handdrawn: ["var(--font-handdrawn)", "Delicious Handrawn", "cursive"],
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
        "2xs": "0 1px 2px 0 rgba(0, 0, 0, 0.02)",
        xs: "0 1px 2px 0 rgba(0, 0, 0, 0.04)",
        sm: "0 1px 3px 0 rgba(0, 0, 0, 0.05), 0 1px 2px -1px rgba(0, 0, 0, 0.03)",
        DEFAULT: "0 1px 3px 0 rgba(0, 0, 0, 0.05), 0 1px 2px -1px rgba(0, 0, 0, 0.03)",
        md: "0 4px 6px -1px rgba(0, 0, 0, 0.05), 0 2px 4px -2px rgba(0, 0, 0, 0.03)",
        lg: "0 10px 15px -3px rgba(0, 0, 0, 0.06), 0 4px 6px -4px rgba(0, 0, 0, 0.03)",
        xl: "0 20px 25px -5px rgba(0, 0, 0, 0.07), 0 8px 10px -6px rgba(0, 0, 0, 0.03)",
        "2xl": "0 25px 50px -12px rgba(0, 0, 0, 0.15)",
        subtle: "0 1px 3px 0 rgba(0, 0, 0, 0.03), 0 1px 2px -1px rgba(0, 0, 0, 0.03)",
        card: "0 0 0 1px rgba(0, 0, 0, 0.04), 0 1px 3px 0 rgba(0, 0, 0, 0.04)",
        "card-hover": "0 0 0 1px rgba(25, 90, 220, 0.15), 0 8px 20px -4px rgba(0, 0, 0, 0.06)",
        popover: "0 10px 38px -10px rgba(22, 23, 24, 0.15), 0 10px 20px -15px rgba(22, 23, 24, 0.1)",
        "glow-blue": "0 0 20px -3px rgba(25, 90, 220, 0.3)",
        "glow-emerald": "0 0 20px -3px rgba(16, 185, 129, 0.3)",
        inner: "inset 0 1px 2px 0 rgba(0, 0, 0, 0.03)",
      },
    },
  },
  plugins: [],
};

export default config;

