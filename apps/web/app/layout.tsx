import type { Metadata } from "next";
import localFont from "next/font/local";
import { JetBrains_Mono } from "next/font/google";
import "./globals.css";
import { AuthProvider } from "@/lib/context/auth-context";

const googleSans = localFont({
  src: "./fonts/GoogleSansFlex.ttf",
  variable: "--font-sans",
  display: "swap",
});

const figtree = localFont({
  src: [
    {
      path: "./fonts/Figtree-VariableFont_wght.ttf",
      style: "normal",
    },
    {
      path: "./fonts/Figtree-Italic-VariableFont_wght.ttf",
      style: "italic",
    },
  ],
  variable: "--font-display",
  display: "swap",
});

const deliciousHandrawn = localFont({
  src: "./fonts/DeliciousHandrawn-Regular.ttf",
  variable: "--font-handdrawn",
  display: "swap",
});

const mono = JetBrains_Mono({
  subsets: ["latin"],
  variable: "--font-mono",
  display: "swap",
});

export const metadata: Metadata = {
  metadataBase: new URL(process.env.NEXT_PUBLIC_APP_URL || "http://localhost:3000"),
  title: "ZapAI — Turn WhatsApp Chats into Instant Razorpay Sales",
  description:
    "Autonomous AI seller agents that discover products, negotiate within your strict margin mandates, lock live stock, and collect instant payments on WhatsApp through Razorpay.",
  keywords: [
    "Razorpay AI Agent",
    "WhatsApp Commerce",
    "Autonomous Seller Agent",
    "Agentic Commerce",
    "UPI Payment Links",
    "Margin Guardrails",
  ],
  icons: {
    icon: [
      { url: "/favicon.ico" },
      { url: "/ZAPAI.png", sizes: "192x192", type: "image/png" },
    ],
    apple: [
      { url: "/apple-touch-icon.png", sizes: "180x180", type: "image/png" },
    ],
    shortcut: "/favicon.ico",
  },
  openGraph: {
    title: "ZapAI — Turn WhatsApp Chats into Instant Razorpay Sales",
    description:
      "Autonomous AI seller agents that discover products, negotiate within your strict margin mandates, lock live stock, and collect instant payments on WhatsApp through Razorpay.",
    images: [{ url: "/ZAPAI.jpg", width: 1024, height: 1024, alt: "ZapAI Logo" }],
  },
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html
      lang="en"
      className={`scroll-smooth ${googleSans.variable} ${figtree.variable} ${deliciousHandrawn.variable} ${mono.variable}`}
    >
      <body className="font-sans antialiased text-[#09090b] bg-[#fbfbfd] selection:bg-[#195adc] selection:text-white tracking-normal">
        <AuthProvider>{children}</AuthProvider>
      </body>
    </html>
  );
}

