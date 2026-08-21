import { HeroHeader } from "@/components/header";
import HeroSection from "@/components/hero-section";
import FlowSection from "@/components/flow-section";
import PrecisionQuoteSection from "@/components/precision-quote-section";
import BuiltForWhomSection from "@/components/built-for-whom-section";
import BudgetValueSection from "@/components/budget-value-section";
import IntegrationSection from "@/components/integration-section";
import CTASection from "@/components/cta-section";
import Footer from "@/components/footer";

export default function Home() {
  return (
    <main className="min-h-screen bg-white text-surface-900 transform-gpu selection:bg-brand-500 selection:text-white">
      {/* Floating Header */}
      <HeroHeader />

      {/* Hero Section with Live Simulator */}
      <HeroSection />

      {/* Transaction Pipeline Architecture (3 Stages) */}
      <FlowSection />

      {/* Editorial Quote Banner */}
      <PrecisionQuoteSection />

      {/* Target Commerce Workflows */}
      <BuiltForWhomSection />

      {/* Mathematical Margin Guardrails & Live Trace Simulator */}
      <BudgetValueSection />

      {/* Seamless Ecosystem Integrations */}
      <IntegrationSection />

      {/* Conversion CTA Banner */}
      <CTASection />

      {/* Obsidian Footer */}
      <Footer />
    </main>
  );
}

