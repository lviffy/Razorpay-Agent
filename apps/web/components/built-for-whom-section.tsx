'use client'

import React, { useState } from 'react'
import { motion, AnimatePresence } from 'framer-motion'
import {
  Store,
  ShieldCheck,
  CreditCard,
  CheckCircle2,
  Lock,
  Smartphone,
  Zap,
  ShoppingBag,
  ArrowRight,
  TrendingUp,
  Clock,
  Layers,
  Sparkles,
} from 'lucide-react'
import Link from 'next/link'
import { Button } from '@/components/ui/button'
import { cn } from '@/lib/utils'

function WhatsAppSellingCard() {
  return (
    <div className="w-full h-full bg-[#f8fafc] rounded-2xl p-4 sm:p-5 border border-black/[0.08] flex flex-col justify-between space-y-3 font-sans">
      {/* Mini App Header */}
      <div className="flex items-center justify-between border-b border-black/[0.06] pb-2.5">
        <div className="flex items-center gap-2">
          <div className="w-8 h-8 rounded-full bg-brand-500 text-white flex items-center justify-center font-bold text-xs">
            A
          </div>
          <div>
            <div className="flex items-center gap-1">
              <span className="font-bold text-xs text-surface-900">RunFast Official</span>
              <span className="text-[10px] text-emerald-600 font-bold">✓</span>
            </div>
            <span className="text-[10px] text-surface-500">WhatsApp Verified</span>
          </div>
        </div>
        <span className="text-[10px] font-mono bg-emerald-50 text-emerald-700 border border-emerald-200 px-2 py-0.5 rounded-full font-bold">
          3.4x CONVERSION
        </span>
      </div>

      {/* Message Exchange */}
      <div className="space-y-2 text-xs">
        <div className="bg-white p-2.5 rounded-xl rounded-tl-none border border-black/[0.06] max-w-[85%]">
          <p className="text-surface-800">Can I get Pegasus 40 UK 9 for ₹3,400?</p>
          <span className="text-[9px] text-surface-400 block text-right mt-0.5">10:40 AM</span>
        </div>

        <div className="bg-[#d9fdd3] p-2.5 rounded-xl rounded-tr-none border border-[#c4eec0] ml-auto max-w-[88%] space-y-1.5">
          <p className="text-surface-900 font-medium">
            I can’t do ₹3,400, but I’ve reserved 1 unit for ₹3,699 with Free Express Delivery! 🚀
          </p>
          <div className="bg-[#0c2340] text-white p-2 rounded-lg text-[11px] flex items-center justify-between">
            <div>
              <span className="block font-bold">Razorpay 1-Tap UPI</span>
              <span className="text-[9px] text-blue-200">₹3,699 (Floor Protected)</span>
            </div>
            <span className="bg-brand-500 text-white px-2 py-0.5 rounded text-[10px] font-bold">
              Pay ₹3,699
            </span>
          </div>
        </div>
      </div>

      {/* Bottom Telemetry */}
      <div className="text-[10px] font-mono text-surface-500 flex items-center justify-between pt-1 border-t border-black/[0.06]">
        <span className="text-emerald-700 font-semibold flex items-center gap-1">
          <CheckCircle2 className="w-3 h-3 text-emerald-600" />
          Paid via PhonePe UPI in 14s
        </span>
        <span>Order #AB-9921</span>
      </div>
    </div>
  )
}

function UnifiedCatalogCard() {
  return (
    <div className="w-full h-full bg-[#f8fafc] rounded-2xl p-4 sm:p-5 border border-black/[0.08] flex flex-col justify-between space-y-3 font-sans">
      <div className="flex items-center justify-between border-b border-black/[0.06] pb-2.5">
        <div className="flex items-center gap-2">
          <div className="w-7 h-7 rounded-lg bg-[#95BF47] text-white flex items-center justify-center font-bold text-xs">
            S
          </div>
          <span className="font-bold text-xs text-surface-900">Shopify &amp; Catalog Sync</span>
        </div>
        <span className="text-[10px] font-mono bg-blue-50 text-brand-700 px-2 py-0.5 rounded-full font-bold border border-blue-200">
          OAUTH 2.0 CONNECTED
        </span>
      </div>

      <div className="space-y-2 text-xs">
        <div className="p-2.5 bg-white rounded-xl border border-black/[0.06] flex items-center justify-between">
          <div>
            <span className="font-bold text-surface-900 block">Nike Pegasus 40 (UK 9)</span>
            <span className="text-[10px] font-mono text-surface-500">MSRP: ₹4,299 • Floor: ₹3,500</span>
          </div>
          <span className="text-[10px] font-mono font-bold text-emerald-700 bg-emerald-50 px-2 py-1 rounded-md border border-emerald-200">
            14 in Stock
          </span>
        </div>

        <div className="p-2.5 bg-white rounded-xl border border-black/[0.06] flex items-center justify-between">
          <div>
            <span className="font-bold text-surface-900 block">RunFast Hydro Vest (5L)</span>
            <span className="text-[10px] font-mono text-surface-500">MSRP: ₹2,899 • Floor: ₹2,200</span>
          </div>
          <span className="text-[10px] font-mono font-bold text-amber-700 bg-amber-50 px-2 py-1 rounded-md border border-amber-200">
            2 Units (1 Locked)
          </span>
        </div>
      </div>

      <div className="p-2.5 bg-brand-50 rounded-xl border border-brand-200 text-[10.5px] font-mono text-brand-900 flex items-center justify-between">
        <span className="flex items-center gap-1.5 font-bold">
          <Lock className="w-3 h-3 text-brand-600" />
          15-Min Concurrency Lock
        </span>
        <span className="text-brand-700 font-semibold">Zero Double-Selling</span>
      </div>
    </div>
  )
}

function RazorpaySettlementCard() {
  return (
    <div className="w-full h-full bg-[#0c2340] rounded-2xl p-4 sm:p-5 border border-blue-900/60 flex flex-col justify-between space-y-3 font-sans text-white">
      <div className="flex items-center justify-between border-b border-white/10 pb-2.5">
        <div className="flex items-center gap-2">
          <div className="w-7 h-7 rounded-lg bg-[#0052ff] text-white flex items-center justify-center font-bold text-xs">
            R
          </div>
          <span className="font-bold text-xs text-white">Razorpay Webhook Engine</span>
        </div>
        <span className="text-[10px] font-mono bg-emerald-500/20 text-emerald-300 px-2 py-0.5 rounded-full font-bold border border-emerald-500/40">
          HMAC VERIFIED
        </span>
      </div>

      <div className="space-y-2 text-xs font-mono">
        <div className="p-2.5 bg-white/5 rounded-xl border border-white/10 space-y-1">
          <div className="flex items-center justify-between text-[10px] text-gray-400">
            <span>event: payment.captured</span>
            <span className="text-emerald-400 font-bold">SUCCESS (200)</span>
          </div>
          <p className="text-white text-[11px]">Amount: ₹3,699.00 • ID: pay_Rzp982012</p>
          <span className="text-[9px] text-blue-300 block">Bank Auth: HDFC_UPI_98218042</span>
        </div>

        <div className="p-2.5 bg-white/5 rounded-xl border border-white/10 flex items-center justify-between text-[10px]">
          <span className="text-gray-300">Auto-Fulfillment &amp; ERP Commit</span>
          <span className="text-emerald-400 font-bold">Executed in 12ms</span>
        </div>
      </div>

      <div className="text-[10px] font-mono text-gray-400 flex items-center justify-between pt-1 border-t border-white/10">
        <span>Settlement Window: Instant T+0</span>
        <span className="text-emerald-400">PCI-DSS Level 1</span>
      </div>
    </div>
  )
}

const targetSegments = [
  {
    id: 'd2c',
    tabName: 'D2C Brands',
    title: 'Built for High-Growth D2C Brands',
    subtitle: 'Direct WhatsApp Selling Without Web Drop-Off',
    description:
      'Transform casual social media leads and abandoned shopping inquiries into immediate paying customers on WhatsApp with personalized multi-turn AI negotiation.',
    bullets: [
      '3.4x Higher Conversion vs Web Storefronts',
      'Personalized Product Recommendations & Size Advice',
      'Automated Negotiation within Pre-set Margins',
      'Instant One-Tap UPI Checkout via Razorpay',
    ],
    illustration: WhatsAppSellingCard,
  },
  {
    id: 'merchants',
    tabName: 'Shopify Power Sellers',
    title: 'Built for High-Volume Shopify Merchants',
    subtitle: 'Unified Catalog & Automated Stock Protection',
    description:
      'Sync 100+ Shopify SKUs or manage a native catalog with zero technical overhead. Automated 15-minute unit locking ensures no inventory conflicts during sales drops.',
    bullets: [
      'One-Click Shopify OAuth & Variant Sync',
      'Granular Margin Floor Rules per SKU',
      'Autonomous 15-Minute Unit Reservation Locks',
      'Multi-Variant and Sizing Recommendations',
    ],
    illustration: UnifiedCatalogCard,
  },
  {
    id: 'enterprise',
    tabName: 'Enterprise Commerce',
    title: 'Built for Multi-Store Retailers & Enterprises',
    subtitle: 'Banking-Grade Rails & Human Escalation',
    description:
      'Scale across dedicated WhatsApp numbers with seamless human escalation rules, cryptographic webhook auditing, and zero merchant secret exposure.',
    bullets: [
      'Official WhatsApp Cloud API Multi-Number Routing',
      'HMAC SHA-256 Verified Webhook Gateway',
      'One-Click Human Agent Live Takeover',
      'Audit Trails for Every Price Negotiation',
    ],
    illustration: RazorpaySettlementCard,
  },
]

export default function BuiltForWhomSection() {
  const [activeTab, setActiveTab] = useState<string>('d2c')
  const current = targetSegments.find((s) => s.id === activeTab) || targetSegments[0]
  const IllustrationComponent = current.illustration

  return (
    <section id="mandates" className="py-20 sm:py-28 overflow-hidden text-surface-900 bg-white border-b border-black/[0.06]">
      <div className="max-w-[1240px] mx-auto px-4 sm:px-6 lg:px-8 space-y-12">
        {/* Header */}
        <div className="flex flex-col lg:flex-row lg:items-end justify-between gap-6">
          <div className="max-w-2xl space-y-3">
            <div className="inline-flex items-center gap-2 px-3 py-1 rounded-full bg-brand-50 border border-brand-200/80 text-[11px] font-mono font-bold text-brand-700 uppercase">
              <Store className="w-3.5 h-3.5" />
              <span>Tailored Commerce Workflows</span>
            </div>
            <h2 className="font-display text-3xl sm:text-4xl lg:text-5xl font-extrabold tracking-tight text-surface-900 leading-[1.12]">
              Designed for modern merchants, <br />
              <span className="text-brand-600">engineered for margins.</span>
            </h2>
          </div>

          <div className="flex items-center gap-1 p-1 bg-surface-100/90 rounded-full border border-black/[0.08] overflow-x-auto max-w-full [scrollbar-width:none]">
            {targetSegments.map((segment) => (
              <button
                key={segment.id}
                onClick={() => setActiveTab(segment.id)}
                className={cn(
                  'px-3.5 sm:px-4 py-2 rounded-full text-xs font-mono font-bold transition-all cursor-pointer whitespace-nowrap',
                  activeTab === segment.id
                    ? 'bg-brand-600 text-white'
                    : 'text-surface-600 hover:text-surface-900 hover:bg-white'
                )}
              >
                {segment.tabName}
              </button>
            ))}
          </div>
        </div>

        {/* 2-Pane Frame with Apple Card Elevation */}
        <div className="apple-card-elevated rounded-[2.5rem] p-6 sm:p-10 grid grid-cols-1 lg:grid-cols-12 gap-8 items-center border border-black/[0.08]">
          {/* Left Description (6 cols) */}
          <div className="lg:col-span-6 space-y-6">
            <AnimatePresence mode="wait">
              <motion.div
                key={current.id}
                initial={{ opacity: 0, y: 6 }}
                animate={{ opacity: 1, y: 0 }}
                exit={{ opacity: 0, y: -6 }}
                transition={{ duration: 0.15 }}
                className="space-y-4"
              >
                <div className="space-y-1.5">
                  <span className="text-xs font-mono font-bold text-brand-600 uppercase tracking-wider">
                    {current.subtitle}
                  </span>
                  <h3 className="font-display text-2xl sm:text-3xl font-extrabold text-surface-900 tracking-tight">
                    {current.title}
                  </h3>
                </div>

                <p className="text-xs sm:text-sm text-surface-600 leading-relaxed font-normal">
                  {current.description}
                </p>

                <div className="space-y-2.5 pt-2">
                  {current.bullets.map((b, i) => (
                    <div key={i} className="flex items-center gap-2.5 text-xs sm:text-sm text-surface-800 font-medium">
                      <CheckCircle2 className="w-4 h-4 text-emerald-600 shrink-0" />
                      <span>{b}</span>
                    </div>
                  ))}
                </div>

                <div className="pt-4">
                  <Link href="/onboarding">
                    <Button className="apple-button-primary font-bold rounded-full text-xs px-6 h-11 gap-2 cursor-pointer">
                      <span>Get Started with {current.tabName}</span>
                      <ArrowRight className="w-3.5 h-3.5" />
                    </Button>
                  </Link>
                </div>
              </motion.div>
            </AnimatePresence>
          </div>

          {/* Right Interactive Illustration (6 cols) */}
          <div className="lg:col-span-6 min-h-[350px] sm:min-h-[380px] lg:aspect-[4/3] bg-surface-50 border border-black/[0.08] rounded-[2rem] p-3 sm:p-4 flex items-center justify-center overflow-hidden">
            <AnimatePresence mode="wait">
              <motion.div
                key={current.id}
                initial={{ opacity: 0, scale: 0.98 }}
                animate={{ opacity: 1, scale: 1 }}
                exit={{ opacity: 0, scale: 0.98 }}
                transition={{ duration: 0.15 }}
                className="w-full h-full"
              >
                <IllustrationComponent />
              </motion.div>
            </AnimatePresence>
          </div>
        </div>
      </div>
    </section>
  )
}