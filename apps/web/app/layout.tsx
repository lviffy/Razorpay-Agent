import type { Metadata } from "next";
import "./globals.css";

export const metadata: Metadata = {
  title: "AgentBridge — Turn WhatsApp Chats into Instant Razorpay Sales",
  description:
    "Autonomous AI seller agents that discover products, negotiate within your strict margin mandates, lock live stock, and collect instant payments on WhatsApp through Razorpay.",
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html lang="en" className="scroll-smooth">
      <body className="font-sans antialiased text-[#09090b] bg-white selection:bg-[#195adc] selection:text-white">
        {children}
      </body>
    </html>
  );
}
