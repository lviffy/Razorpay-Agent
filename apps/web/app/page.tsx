import { HeroHeader } from "@/components/header";
import HeroSection from "@/components/hero-section";
import TrustMarquee from "@/components/trust-marquee";
import AgentNegotiationSection from "@/components/agent-negotiation";
import MarginPlayground from "@/components/margin-playground";
import PaymentFlowSection from "@/components/payment-flow";
import AuditTrailSection from "@/components/audit-trail";
import ComparisonSection from "@/components/comparison-section";
import IntegrationSection from "@/components/integration-section";
import CTASection from "@/components/cta-section";
import Footer from "@/components/footer";

export default function Home() {
  return (
    <main className="min-h-screen apple-canvas text-surface-900 selection:bg-brand-500 selection:text-white relative overflow-x-clip">
      {/* Floating Glass Navigation */}
      <HeroHeader />

      {/* 1. HERO: AI agents that negotiate and buy on WhatsApp */}
      <HeroSection />

      {/* Trust & Architecture Marquee */}
      <TrustMarquee />

      {/* 2. AGENT-TO-AGENT NEGOTIATION: Multi-Store Comparison, Bidding & 5-Stage Settlement */}
      <AgentNegotiationSection />

      {/* 3. MERCHANT CONTROL / MARGIN PROTECTION: Let agents negotiate. Never let them break your margins */}
      <MarginPlayground />

      {/* 4. RAZORPAY PAYMENT FLOW: How x402 Meets Razorpay (Programmable Handshake to Real INR) */}
      <PaymentFlowSection />

      {/* 5. AUDIT TRAIL: Every agent action leaves a trail (5-Field Linked Chain) */}
      <AuditTrailSection />

      {/* 6. WHY AGENTIC COMMERCE: Human Storefronts vs Machine-Native Primitives */}
      <ComparisonSection />

      {/* 7. INTEGRATIONS: WhatsApp, Shopify, Razorpay, Gemini, Redis, Postgres */}
      <IntegrationSection />

      {/* 8. FINAL CTA: Give your store an agent */}
      <CTASection />

      {/* Footer */}
      <Footer />
    </main>
  );
}
