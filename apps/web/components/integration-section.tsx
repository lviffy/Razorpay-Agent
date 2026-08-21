'use client'

import React from 'react'
import { motion } from 'framer-motion'
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
  Boxes,
} from 'lucide-react'

const INTEGRATIONS_ROW_1 = [
  { icon: CreditCard, color: 'text-brand-600', bg: 'bg-brand-50', label: 'Razorpay Payment Links', sub: 'Instant 1-Tap UPI' },
  { icon: Smartphone, color: 'text-emerald-600', bg: 'bg-emerald-50', label: 'WhatsApp Cloud API', sub: 'Official Meta BSP' },
  { icon: ShoppingBag, color: 'text-emerald-700', bg: 'bg-emerald-50', label: 'Shopify OAuth 2.0', sub: 'Real-Time Catalog Sync' },
  { icon: Zap, color: 'text-amber-600', bg: 'bg-amber-50', label: 'Google Pay & PhonePe', sub: 'Deep-Linked UPI Intent' },
  { icon: ShieldCheck, color: 'text-brand-600', bg: 'bg-brand-50', label: 'HMAC Webhooks', sub: 'Cryptographic Auth' },
  { icon: Sparkles, color: 'text-purple-600', bg: 'bg-purple-50', label: 'Gemini 2.5 Flash', sub: 'Sub-45ms Natural Reasoning' },
]

const INTEGRATIONS_ROW_2 = [
  { icon: Store, color: 'text-brand-600', bg: 'bg-brand-50', label: 'Native Catalog Engine', sub: 'Custom SKU Management' },
  { icon: Lock, color: 'text-amber-600', bg: 'bg-amber-50', label: '15m Concurrency Lock', sub: 'Atomic Unit Hold' },
  { icon: Layers, color: 'text-blue-600', bg: 'bg-blue-50', label: 'Merchant Telemetry', sub: 'Live Conversion Logs' },
  { icon: Database, color: 'text-brand-600', bg: 'bg-brand-50', label: 'Audit Trail Ledger', sub: 'Price Negotiation History' },
  { icon: Globe, color: 'text-indigo-600', bg: 'bg-indigo-50', label: 'Meta Business Manager', sub: 'Verified Blue/Green Badge' },
  { icon: CheckCircle2, color: 'text-emerald-600', bg: 'bg-emerald-50', label: 'Auto-Order Fulfillment', sub: 'ERP & Shiprocket Webhook' },
]

export default function IntegrationSection() {
  return (
    <section
      id="integrations"
      className="py-20 sm:py-28 overflow-hidden text-surface-900 bg-[#fbfbfd] border-b border-black/[0.06]"
    >
      <div className="max-w-[1240px] mx-auto px-4 sm:px-6 lg:px-8 relative z-10 space-y-12">
        <div className="text-center space-y-3 max-w-2xl mx-auto">
          <div className="inline-flex items-center gap-2 px-3 py-1 rounded-full bg-brand-50 border border-brand-200/80 text-[11px] font-mono font-bold text-brand-700 uppercase">
            <Boxes className="w-3.5 h-3.5" />
            <span>Connected Architecture</span>
          </div>
          <h2 className="font-display text-3xl sm:text-4xl lg:text-5xl font-extrabold tracking-tight text-surface-900 leading-[1.12]">
            Seamless Commerce Integrations
          </h2>
          <p className="text-base text-surface-600 leading-relaxed font-normal">
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
          <InfiniteSlider speed={35} gap={16}>
            {INTEGRATIONS_ROW_1.map((item, idx) => (
              <div
                key={idx}
                className="flex items-center gap-3 p-4 bg-white apple-card rounded-2xl transition-all duration-200 hover:border-brand-500/40 cursor-default min-w-[240px]"
              >
                <div className={`w-10 h-10 rounded-xl ${item.bg} flex items-center justify-center shrink-0`}>
                  <item.icon className={`w-5 h-5 ${item.color}`} />
                </div>
                <div className="flex flex-col">
                  <span className="font-bold text-xs text-surface-900 font-sans">
                    {item.label}
                  </span>
                  <span className="text-[10px] text-surface-500 font-mono">
                    {item.sub}
                  </span>
                </div>
              </div>
            ))}
          </InfiniteSlider>

          <InfiniteSlider speed={30} gap={16} reverse className="mt-4">
            {INTEGRATIONS_ROW_2.map((item, idx) => (
              <div
                key={idx}
                className="flex items-center gap-3 p-4 bg-white apple-card rounded-2xl transition-all duration-200 hover:border-brand-500/40 cursor-default min-w-[240px]"
              >
                <div className={`w-10 h-10 rounded-xl ${item.bg} flex items-center justify-center shrink-0`}>
                  <item.icon className={`w-5 h-5 ${item.color}`} />
                </div>
                <div className="flex flex-col">
                  <span className="font-bold text-xs text-surface-900 font-sans">
                    {item.label}
                  </span>
                  <span className="text-[10px] text-surface-500 font-mono">
                    {item.sub}
                  </span>
                </div>
              </div>
            ))}
          </InfiniteSlider>
        </div>
      </div>
    </section>
  )
}
