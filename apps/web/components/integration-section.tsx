'use client'
import React, { useRef } from 'react'
import { motion, useScroll, useTransform } from 'framer-motion'
import { InfiniteSlider } from './ui/infinite-slider'
import {
  CreditCard,
  Smartphone,
  ShoppingBag,
  Zap,
  ShieldCheck,
  Sparkles,
  Store,
  Lock,
  Layers,
  CheckCircle2,
  Database,
  Globe,
} from 'lucide-react'

const INTEGRATIONS = [
  { icon: CreditCard, color: 'text-[#195adc]', label: 'Razorpay Rails' },
  { icon: Smartphone, color: 'text-[#195adc]', label: 'WhatsApp Cloud' },
  { icon: ShoppingBag, color: 'text-[#195adc]', label: 'Shopify Sync' },
  { icon: Zap, color: 'text-[#195adc]', label: 'UPI Payments' },
  { icon: ShieldCheck, color: 'text-[#195adc]', label: 'HMAC Webhooks' },
  { icon: Sparkles, color: 'text-[#195adc]', label: 'Gemini Intent' },
  { icon: Store, color: 'text-[#195adc]', label: 'Native Catalog' },
  { icon: Lock, color: 'text-[#195adc]', label: 'Stock Locks' },
  { icon: Layers, color: 'text-[#195adc]', label: 'Merchant Telemetry' },
  { icon: Database, color: 'text-[#195adc]', label: 'Audit Logs' },
  { icon: Globe, color: 'text-[#195adc]', label: 'Meta Business' },
  { icon: CheckCircle2, color: 'text-[#195adc]', label: 'Order Fulfillment' },
]

export default function IntegrationSection() {
  const containerRef = useRef<HTMLElement>(null)

  const { scrollYProgress } = useScroll({
    target: containerRef,
    offset: ['start end', 'end start'],
  })

  const opacity = useTransform(scrollYProgress, [0, 0.2, 0.8, 1], [0, 1, 1, 0])
  const scale = useTransform(scrollYProgress, [0, 0.2], [0.95, 1])

  return (
    <section
      ref={containerRef}
      id="integrations"
      className="py-16 sm:py-24 bg-slate-50 text-[#09090b] relative overflow-hidden border-t border-[#e4e4e7]"
    >
      <motion.div
        style={{ opacity, scale }}
        className="max-w-[1300px] mx-auto px-4 sm:px-6 lg:px-8 relative z-10"
      >
        <div className="text-center mb-8 sm:mb-12 space-y-3">
          <h2 className="text-3xl sm:text-4xl lg:text-5xl font-semibold tracking-tight text-[#09090b]">
            Seamless Commerce Integrations
          </h2>
          <p className="text-base sm:text-lg text-[#52525b] leading-relaxed max-w-xl mx-auto">
            Your WhatsApp conversations, inventory catalogs, and Razorpay checkout rails are
            connected in one continuous autonomous loop.
          </p>
        </div>

        <div
          className="relative group"
          style={{
            maskImage:
              'linear-gradient(to right, transparent 0%, black 12%, black 88%, transparent 100%)',
            WebkitMaskImage:
              'linear-gradient(to right, transparent 0%, black 12%, black 88%, transparent 100%)',
          }}
        >
          <InfiniteSlider speed={40} gap={16}>
            {INTEGRATIONS.map((item, idx) => (
              <div
                key={idx}
                className="flex flex-col items-center justify-center p-3.5 sm:p-5 min-w-[90px] sm:min-w-[130px] bg-white border border-[#e4e4e7] rounded-2xl transition-all group/item shadow-2xs"
              >
                <item.icon
                  className={`w-6 h-6 sm:w-7 sm:h-7 ${item.color} mb-2 transition-transform duration-300 group-hover/item:scale-110`}
                />
                <span className="font-mono font-bold text-[#09090b] text-center uppercase tracking-wider text-[9px] sm:text-[10.5px] whitespace-nowrap">
                  {item.label}
                </span>
              </div>
            ))}
          </InfiniteSlider>

          <InfiniteSlider speed={35} gap={16} reverse className="mt-3 sm:mt-4">
            {[...INTEGRATIONS].reverse().map((item, idx) => (
              <div
                key={idx}
                className="flex flex-col items-center justify-center p-3.5 sm:p-5 min-w-[90px] sm:min-w-[130px] bg-white border border-[#e4e4e7] rounded-2xl transition-all group/item shadow-2xs"
              >
                <item.icon
                  className={`w-6 h-6 sm:w-7 sm:h-7 ${item.color} mb-2 transition-transform duration-300 group-hover/item:scale-110`}
                />
                <span className="font-mono font-bold text-[#09090b] text-center uppercase tracking-wider text-[9px] sm:text-[10.5px] whitespace-nowrap">
                  {item.label}
                </span>
              </div>
            ))}
          </InfiniteSlider>
        </div>
      </motion.div>
    </section>
  )
}
