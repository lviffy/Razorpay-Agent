import { HeroHeader } from "@/components/header";
import HeroSection from "@/components/hero-section";
import TrustMarquee from "@/components/trust-marquee";
import MarginPlayground from "@/components/margin-playground";
import FlowSection from "@/components/flow-section";
import ComparisonSection from "@/components/comparison-section";
import PrecisionQuoteSection from "@/components/precision-quote-section";
import BuiltForWhomSection from "@/components/built-for-whom-section";
import IntegrationSection from "@/components/integration-section";
import CTASection from "@/components/cta-section";
import Footer from "@/components/footer";

export default function Home() {
  return (
    <main className="min-h-screen apple-canvas text-surface-900 selection:bg-brand-500 selection:text-white relative overflow-x-clip">
      {/* Floating Glass Header */}
      <HeroHeader />

      {/* Hero Section with Live High-Fidelity WhatsApp & 1-Tap UPI Simulator */}
      <HeroSection />

      {/* Official Partner & Payment Ecosystem Marquee */}
      <TrustMarquee />

      {/* Interactive Margin Mandate Playground (Live Sliders & Decision Engine) */}
      <MarginPlayground />

      {/* Dark Bento Architecture Grid (Conversational AI, Floor Barrier, Stock Lock, Razorpay Rails) */}
      <FlowSection />

      {/* The Commerce Shift: Traditional Web Store vs AgentBridge WhatsApp Commerce */}
      <ComparisonSection />

      {/* Authority Editorial Quote Banner */}
      <PrecisionQuoteSection />

      {/* Target Commerce Workflows & Interactive Visual Cards */}
      <BuiltForWhomSection />

      {/* Connected Ecosystem Integrations Slider */}
      <IntegrationSection />

      {/* Obsidian Conversion CTA Banner */}
      <CTASection />

      {/* Obsidian Footer with Live System Uptime */}
      <Footer />
    </main>
  );
}
