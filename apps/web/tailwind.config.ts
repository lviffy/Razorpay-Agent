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
          400: "#378ffa",
          500: "#195adc", // Primary Royal Blue
          600: "#1448b3",
          700: "#103a8f",
          800: "#0c2340", // Razorpay Navy
          900: "#09090b", // Deep Ink
          950: "#050507",
        },
        surface: {
          50: "#f8fafc",
          100: "#f4f4f5",
          200: "#e4e4e7", // Architectural Border
          300: "#d4d4d8",
          400: "#a1a1aa",
          500: "#71717a",
          600: "#52525b", // Editorial Body Ink
          700: "#3f3f46",
          800: "#27272a",
          900: "#09090b", // Primary Text Ink
        },
      },
      fontFamily: {
        sans: ["Inter", "-apple-system", "BlinkMacSystemFont", "Segoe UI", "Roboto", "sans-serif"],
        mono: ["JetBrains Mono", "Menlo", "Monaco", "Consolas", "Courier New", "monospace"],
      },
      borderRadius: {
        lg: "0.5rem",
        md: "0.375rem",
        sm: "0.25rem",
        pill: "9999px",
      },
      boxShadow: {
        none: "none",
        subtle: "0 1px 3px 0 rgba(0, 0, 0, 0.04), 0 1px 2px -1px rgba(0, 0, 0, 0.04)",
        card: "0 4px 20px -2px rgba(0, 0, 0, 0.04)",
        popover: "0 10px 30px -4px rgba(0, 0, 0, 0.07)",
      },
    },
  },
  plugins: [],
};

export default config;
