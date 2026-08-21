import type { Metadata } from "next";
import { Plus_Jakarta_Sans, Inter, JetBrains_Mono } from "next/font/google";
import "./globals.css";

const sans = Inter({
  subsets: ["latin"],
  variable: "--font-sans",
  display: "swap",
});

const display = Plus_Jakarta_Sans({
  subsets: ["latin"],
  variable: "--font-display",
  display: "swap",
  weight: ["400", "500", "600", "700", "800"],
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
      className={`scroll-smooth ${sans.variable} ${display.variable} ${mono.variable}`}
    >
      <body className="font-sans antialiased text-[#09090b] bg-white selection:bg-[#195adc] selection:text-white tracking-normal">
        {children}
      </body>
    </html>
  );
}

