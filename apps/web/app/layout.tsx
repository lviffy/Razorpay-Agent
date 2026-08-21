import type { Metadata } from "next";
import localFont from "next/font/local";
import { JetBrains_Mono } from "next/font/google";
import "./globals.css";

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
  title: "AgentBridge — Turn WhatsApp Chats into Instant Razorpay Sales",
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
        {children}
      </body>
    </html>
  );
}

