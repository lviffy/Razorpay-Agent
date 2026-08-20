import { HeroHeader } from "@/components/header";
import HeroSection from "@/components/hero-section";
import ServicesSection from "@/components/services-section";
import EcosystemSection from "@/components/ecosystem-section";
import FlowSection from "@/components/flow-section";
import PrecisionQuoteSection from "@/components/precision-quote-section";
import BuiltForWhomSection from "@/components/built-for-whom-section";
import MoreThanToolSection from "@/components/more-than-tool-section";
import BudgetValueSection from "@/components/budget-value-section";
import IntegrationSection from "@/components/integration-section";
import CTASection from "@/components/cta-section";
import Footer from "@/components/footer";

export default function Home() {
  return (
    <main className="min-h-screen bg-white text-[#09090b] transform-gpu selection:bg-[#195adc] selection:text-white">
      {/* Floating Header */}
      <HeroHeader />

      {/* Hero Section */}
      <HeroSection />

      {/* Services / Ecosystem Map Section */}
      <ServicesSection />

      {/* Ecosystem Bento Section */}
      <EcosystemSection />

      {/* Flow Section with 50px Grid and 3D Popping Trail Physics */}
      <FlowSection />

      {/* Precision Quote Section */}
      <PrecisionQuoteSection />

      {/* Built For Whom Section with Interactive Illustrations */}
      <BuiltForWhomSection />

      {/* Mobile only: MoreThanToolSection is embedded in BuiltForWhomSection on desktop */}
      <div className="lg:hidden">
        <MoreThanToolSection />
      </div>

      {/* Budget & Value Section with Accordion and Border Beam */}
      <BudgetValueSection />

      {/* Integration Section */}
      <IntegrationSection />

      {/* CTA Section */}
      <CTASection />

      {/* Magazine-Grade Footer */}
      <Footer />
    </main>
  );
}
