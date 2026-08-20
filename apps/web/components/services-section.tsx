'use client'
import React, { useRef } from 'react'
import { motion, useScroll, useTransform } from 'framer-motion'
import { ShieldCheck, Layers, CreditCard, Lock } from 'lucide-react'
import { FloatingBadges, commerceBadges } from '@/components/ui/floating-badges'

const corePillars = [
  {
    icon: ShieldCheck,
    title: 'Autonomous Negotiation Layer',
    description:
      'Understands complex buyer intent, size variants, and price bargaining with real-time mathematical floor price guardrails.',
  },
  {
    icon: Layers,
    title: 'Unified Catalog Spine',
    description:
      'First-class native catalog + optional one-click Shopify sync with real-time stock and multi-variant synchronization.',
  },
  {
    icon: CreditCard,
    title: 'Conversational Checkout Rails',
    description:
      'Instantly creates authenticated Razorpay Payment Links (UPI, Cards, Netbanking) directly inside the conversation.',
  },
  {
    icon: Lock,
    title: 'Merchant Protection & Telemetry',
    description:
      'Zero secret leakage, 15-minute temporary inventory locking, and immutable cryptographic audit trails for every offer.',
  },
]

export default function ServicesSection() {
  const sectionRef = useRef<HTMLElement>(null)

  const { scrollYProgress } = useScroll({
    target: sectionRef,
    offset: ['start end', 'end start'],
  })

  const opacity = useTransform(scrollYProgress, [0, 0.2, 0.8, 1], [0.4, 1, 1, 0.4])

  return (
    <section
      ref={sectionRef}
      id="features"
      className="relative w-full bg-slate-50 text-[#09090b] overflow-hidden"
    >
      {/* Floating Badges */}
      <FloatingBadges position="right" badges={commerceBadges} variant="light" />

      <div className="relative mx-auto max-w-[1300px] px-4 sm:px-6 lg:px-8 pt-12 sm:pt-16 pb-16 sm:pb-24 z-10">
        {/* Section Header */}
        <motion.div style={{ opacity }} className="max-w-3xl mb-12 sm:mb-16">
          <h2 className="text-2xl sm:text-3xl md:text-4xl lg:text-[2.4rem] font-bold tracking-tight text-[#09090b] mb-4 leading-tight [text-wrap:balance]">
            The AgentBridge Commerce Infrastructure
          </h2>
          <div className="space-y-2 text-sm sm:text-base text-[#52525b] leading-relaxed max-w-[65ch] text-pretty">
            <p>
              A single digital infrastructure powering catalog ingestion, WhatsApp conversational
              selling, margin guardrails, and Razorpay settlements.
            </p>
            <p className="font-semibold text-[#09090b]">
              AgentBridge unifies inventory, AI negotiations, and payment rails into one autonomous
              commerce engine.
            </p>
          </div>
        </motion.div>

        {/* Studio Hairline Matrix */}
        <div className="relative max-w-3xl mt-4 sm:mt-6">
          {/* Vertical Center Line (Desktop) */}
          <div
            className="hidden md:block absolute left-1/2 top-0 bottom-0 -translate-x-1/2 w-[1px] bg-[linear-gradient(to_bottom,transparent,rgba(228,228,231,0.55)_15%,rgba(228,228,231,0.55)_85%,transparent)] pointer-events-none z-10"
            aria-hidden="true"
          />

          {/* Top Line */}
          <div
            className="h-[1px] w-full bg-[linear-gradient(to_right,transparent,rgba(228,228,231,0.55)_15%,rgba(228,228,231,0.55)_85%,transparent)]"
            aria-hidden="true"
          />

          {/* Row 1: Pillars 1 & 2 */}
          <div className="grid grid-cols-1 md:grid-cols-2">
            {corePillars.slice(0, 2).map((pillar, i) => {
              const IconComponent = pillar.icon

              return (
                <React.Fragment key={pillar.title}>
                  <motion.div
                    tabIndex={0}
                    initial={{ opacity: 0, y: 16 }}
                    whileInView={{ opacity: 1, y: 0 }}
                    viewport={{ once: true, margin: '-40px' }}
                    transition={{ duration: 0.45, delay: i * 0.08, ease: [0.16, 1, 0.3, 1] }}
                    className="group relative p-6 sm:p-7 transition-colors duration-200 cursor-pointer outline-none overflow-hidden"
                  >
                    <div className="relative z-10">
                      <div className="flex items-center gap-3.5 mb-2.5">
                        <div className="w-9 h-9 rounded-lg bg-[#eff6ff] border border-[#dbeafe] text-[#195adc] group-hover:bg-[#195adc] group-hover:text-white group-hover:border-[#195adc] flex items-center justify-center transition-all duration-200 shrink-0 shadow-2xs">
                          <IconComponent className="w-4 h-4 sm:w-4.5 sm:h-4.5" />
                        </div>
                        <h3 className="text-base font-bold text-[#09090b] tracking-tight group-hover:text-[#195adc] transition-colors duration-200">
                          {pillar.title}
                        </h3>
                      </div>
                      <p className="text-xs sm:text-sm text-[#52525b] leading-relaxed sm:pl-12">
                        {pillar.description}
                      </p>
                    </div>
                  </motion.div>
                  {i === 0 && (
                    <div
                      className="md:hidden h-[1px] w-full bg-[linear-gradient(to_right,transparent,rgba(228,228,231,0.55)_15%,rgba(228,228,231,0.55)_85%,transparent)]"
                      aria-hidden="true"
                    />
                  )}
                </React.Fragment>
              )
            })}
          </div>

          {/* Middle Line */}
          <div
            className="h-[1px] w-full bg-[linear-gradient(to_right,transparent,rgba(228,228,231,0.55)_15%,rgba(228,228,231,0.55)_85%,transparent)]"
            aria-hidden="true"
          />

          {/* Row 2: Pillars 3 & 4 */}
          <div className="grid grid-cols-1 md:grid-cols-2">
            {corePillars.slice(2, 4).map((pillar, i) => {
              const IconComponent = pillar.icon

              return (
                <React.Fragment key={pillar.title}>
                  <motion.div
                    tabIndex={0}
                    initial={{ opacity: 0, y: 16 }}
                    whileInView={{ opacity: 1, y: 0 }}
                    viewport={{ once: true, margin: '-40px' }}
                    transition={{ duration: 0.45, delay: (i + 2) * 0.08, ease: [0.16, 1, 0.3, 1] }}
                    className="group relative p-6 sm:p-7 transition-colors duration-200 cursor-pointer outline-none overflow-hidden"
                  >
                    <div className="relative z-10">
                      <div className="flex items-center gap-3.5 mb-2.5">
                        <div className="w-9 h-9 rounded-lg bg-[#eff6ff] border border-[#dbeafe] text-[#195adc] group-hover:bg-[#195adc] group-hover:text-white group-hover:border-[#195adc] flex items-center justify-center transition-all duration-200 shrink-0 shadow-2xs">
                          <IconComponent className="w-4 h-4 sm:w-4.5 sm:h-4.5" />
                        </div>
                        <h3 className="text-base font-bold text-[#09090b] tracking-tight group-hover:text-[#195adc] transition-colors duration-200">
                          {pillar.title}
                        </h3>
                      </div>
                      <p className="text-xs sm:text-sm text-[#52525b] leading-relaxed sm:pl-12">
                        {pillar.description}
                      </p>
                    </div>
                  </motion.div>
                  {i === 0 && (
                    <div
                      className="md:hidden h-[1px] w-full bg-[linear-gradient(to_right,transparent,rgba(228,228,231,0.55)_15%,rgba(228,228,231,0.55)_85%,transparent)]"
                      aria-hidden="true"
                    />
                  )}
                </React.Fragment>
              )
            })}
          </div>

          {/* Bottom Line */}
          <div
            className="h-[1px] w-full bg-[linear-gradient(to_right,transparent,rgba(228,228,231,0.55)_15%,rgba(228,228,231,0.55)_85%,transparent)]"
            aria-hidden="true"
          />
        </div>
      </div>
    </section>
  )
}
