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
  { icon: CreditCard, color: 'text-brand-600', label: 'Razorpay Rails' },
  { icon: Smartphone, color: 'text-brand-600', label: 'WhatsApp Cloud' },
  { icon: ShoppingBag, color: 'text-brand-600', label: 'Shopify Sync' },
  { icon: Zap, color: 'text-emerald-600', label: '1-Tap UPI Pay' },
  { icon: ShieldCheck, color: 'text-brand-600', label: 'HMAC Webhooks' },
  { icon: Sparkles, color: 'text-brand-600', label: 'Gemini 2.5 Intent' },
  { icon: Store, color: 'text-brand-600', label: 'Native Catalog' },
  { icon: Lock, color: 'text-brand-600', label: '15m Stock Locks' },
  { icon: Layers, color: 'text-brand-600', label: 'Merchant Telemetry' },
  { icon: Database, color: 'text-brand-600', label: 'Audit Trails' },
  { icon: Globe, color: 'text-brand-600', label: 'Meta Business' },
  { icon: CheckCircle2, color: 'text-emerald-600', label: 'Order Fulfillment' },
]

export default function IntegrationSection() {
  return (
    <section
      id="integrations"
      className="py-20 sm:py-28 overflow-hidden text-surface-900"
    >
      <div className="max-w-[1240px] mx-auto px-4 sm:px-6 lg:px-8 relative z-10 space-y-12">
        <div className="text-center space-y-3 max-w-2xl mx-auto">
          <h2 className="font-display text-3xl sm:text-4xl lg:text-5xl font-extrabold tracking-tight text-surface-900 leading-[1.12]">
            Seamless Commerce Integrations
          </h2>
          <p className="text-base text-surface-600 leading-relaxed">
            Your WhatsApp conversations, inventory catalogs, and Razorpay checkout rails are
            connected in one continuous autonomous loop.
          </p>
        </div>

        <div
          className="relative group pt-4"
          style={{
            maskImage:
              'linear-gradient(to right, transparent 0%, black 15%, black 85%, transparent 100%)',
            WebkitMaskImage:
              'linear-gradient(to right, transparent 0%, black 15%, black 85%, transparent 100%)',
          }}
        >
          <InfiniteSlider speed={40} gap={16}>
            {INTEGRATIONS.map((item, idx) => (
              <div
                key={idx}
                className="flex flex-col items-center justify-center p-4 sm:p-5 min-w-[110px] sm:min-w-[140px] apple-card rounded-2xl transition-all duration-200 group/item hover:bg-white hover:border-black/[0.12] hover:shadow-card cursor-default"
              >
                <item.icon
                  className={`w-6 h-6 sm:w-7 sm:h-7 ${item.color} mb-2.5 transition-transform duration-200 group-hover/item:scale-110`}
                />
                <span className="font-mono font-bold text-surface-800 text-center uppercase tracking-wider text-[10px] sm:text-[11px] whitespace-nowrap">
                  {item.label}
                </span>
              </div>
            ))}
          </InfiniteSlider>

          <InfiniteSlider speed={35} gap={16} reverse className="mt-3 sm:mt-4">
            {[...INTEGRATIONS].reverse().map((item, idx) => (
              <div
                key={idx}
                className="flex flex-col items-center justify-center p-4 sm:p-5 min-w-[110px] sm:min-w-[140px] apple-card rounded-2xl transition-all duration-200 group/item hover:bg-white hover:border-black/[0.12] hover:shadow-card cursor-default"
              >
                <item.icon
                  className={`w-6 h-6 sm:w-7 sm:h-7 ${item.color} mb-2.5 transition-transform duration-200 group-hover/item:scale-110`}
                />
                <span className="font-mono font-bold text-surface-800 text-center uppercase tracking-wider text-[10px] sm:text-[11px] whitespace-nowrap">
                  {item.label}
                </span>
              </div>
            ))}
          </InfiniteSlider>
        </div>
      </div>
    </section>
  )
}

