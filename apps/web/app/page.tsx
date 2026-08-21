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
    <main className="min-h-screen apple-canvas text-surface-900 selection:bg-brand-500 selection:text-white relative overflow-x-clip">
      {/* Ambient Radial Mesh Lighting Layers */}
      <div 
        aria-hidden="true" 
        className="pointer-events-none absolute top-0 left-1/2 -translate-x-1/2 w-[1400px] h-[700px] bg-[radial-gradient(ellipse_at_top,rgba(25,90,220,0.09)_0%,rgba(120,170,255,0.04)_40%,transparent_70%)] blur-3xl -z-10" 
      />
      <div 
        aria-hidden="true" 
        className="pointer-events-none absolute top-[35%] right-[-200px] w-[900px] h-[600px] bg-[radial-gradient(circle,rgba(0,82,255,0.04)_0%,transparent_65%)] blur-3xl -z-10" 
      />
      <div 
        aria-hidden="true" 
        className="pointer-events-none absolute top-[65%] left-[-200px] w-[900px] h-[600px] bg-[radial-gradient(circle,rgba(25,90,220,0.035)_0%,transparent_65%)] blur-3xl -z-10" 
      />

      {/* Floating Glass Header */}
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

