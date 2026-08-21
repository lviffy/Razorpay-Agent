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
        "2xs": "none",
        xs: "none",
        sm: "none",
        DEFAULT: "none",
        md: "none",
        lg: "none",
        xl: "none",
        "2xl": "none",
        subtle: "none",
        card: "none",
        "card-hover": "none",
        popover: "none",
        "glow-blue": "none",
        "glow-emerald": "none",
        inner: "none",
      },
    },
  },
  plugins: [],
};

export default config;

