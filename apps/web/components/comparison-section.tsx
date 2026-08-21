'use client'

import React from 'react'
import { motion } from 'framer-motion'
import {
  CheckCircle2,
  XCircle,
  Zap,
  TrendingUp,
  Clock,
  ShieldCheck,
  ShoppingBag,
  ArrowRight,
} from 'lucide-react'
import Link from 'next/link'
import { Button } from '@/components/ui/button'

const COMPARISONS = [
  {
    feature: 'Checkout Friction & Speed',
    traditional: '5-step checkout (Add to Cart -> Address -> OTP -> Gateway). Average 3m 45s.',
    agentbridge: 'Instant 1-Tap UPI in WhatsApp chat. Average 18 seconds to paid order.',
    badge: '12x Faster',
  },
  {
    feature: 'Price Negotiation & Bargaining',
    traditional: 'Static fixed prices. Shoppers walk away if ₹200 outside their budget.',
    agentbridge: 'Autonomous multi-turn negotiation strictly within your profit floor mandates.',
    badge: 'Zero Margin Leaks',
  },
  {
    feature: 'Cart Abandonment Recovery',
    traditional: 'Cold emails with 14% open rates. Most abandoned leads are lost forever.',
    agentbridge: '96% WhatsApp message read rate with proactive sweetener counter-offers.',
    badge: '3.4x Conversion',
  },
  {
    feature: 'Inventory Double-Selling Protection',
    traditional: 'Race conditions during flash sales or manual WhatsApp selling.',
    agentbridge: 'Deterministic 15-minute atomic concurrency unit locks with auto-release.',
    badge: '100% Stock Safe',
  },
  {
    feature: 'Payment Settlement Rails',
    traditional: 'Manual screenshot sharing, delayed bank verification, high fraud risk.',
    agentbridge: 'Direct Razorpay UPI payment links + HMAC SHA-256 verified webhooks.',
    badge: 'Banking-Grade',
  },
]

export default function ComparisonSection() {
  return (
    <section
      id="comparison"
      className="py-20 sm:py-28 bg-[#fbfbfd] text-surface-900 relative overflow-hidden"
    >
      <div className="mx-auto max-w-[1240px] px-4 sm:px-6 lg:px-8 space-y-12 relative z-10">
        {/* Header */}
        <div className="text-center space-y-3 max-w-2xl mx-auto">
          <div className="inline-flex items-center gap-2 px-3 py-1 rounded-full bg-brand-50 border border-brand-200/80 text-[11px] font-mono font-bold text-brand-700 uppercase">
            <TrendingUp className="w-3.5 h-3.5" />
            <span>The Commerce Paradigm Shift</span>
          </div>
          <h2 className="font-display text-3xl sm:text-4xl lg:text-5xl font-extrabold tracking-tight text-surface-900 leading-[1.12]">
            Why WhatsApp Outperforms Traditional Web Stores
          </h2>
          <p className="text-sm sm:text-base text-surface-600 leading-relaxed font-normal">
            Indian consumers already live on WhatsApp. Meeting them where they converse transforms
            high-intent inquiries into immediate Razorpay revenue.
          </p>
        </div>

        {/* Comparison Table / Matrix */}
        <div className="apple-card-elevated rounded-[2rem] overflow-hidden border border-black/[0.08]">
          {/* Table Header (Desktop) */}
          <div className="hidden md:grid grid-cols-12 bg-surface-100/90 border-b border-black/[0.08] text-xs font-mono font-bold uppercase text-surface-700">
            <div className="col-span-4 p-4 sm:p-5">Capability / Workflow</div>
            <div className="col-span-4 p-4 sm:p-5 text-surface-700 bg-surface-100/50 flex items-center gap-1.5 border-l border-black/[0.06]">
              <XCircle className="w-4 h-4 text-rose-500" />
              <span>Traditional Web Storefronts</span>
            </div>
            <div className="col-span-4 p-4 sm:p-5 text-brand-700 bg-brand-50/40 flex items-center gap-1.5 border-l border-black/[0.06]">
              <CheckCircle2 className="w-4 h-4 text-brand-600" />
              <span>AgentBridge WhatsApp Agent</span>
            </div>
          </div>

          {/* Table Rows */}
          <div className="divide-y divide-black/[0.06]">
            {COMPARISONS.map((row, idx) => (
              <div
                key={idx}
                className="grid grid-cols-1 md:grid-cols-12 text-xs sm:text-sm items-stretch hover:bg-surface-50/50 transition-colors"
              >
                {/* Feature Title & Badge */}
                <div className="md:col-span-4 p-4 sm:p-5 space-y-1.5 flex flex-col justify-center bg-surface-50/30 md:bg-transparent">
                  <span className="font-bold text-surface-900 font-sans block text-sm sm:text-base">
                    {row.feature}
                  </span>
                  <span className="inline-flex self-start px-2 py-0.5 rounded-md bg-surface-200/80 text-surface-700 font-mono text-[10px] font-bold">
                    {row.badge}
                  </span>
                </div>

                {/* Traditional Side */}
                <div className="md:col-span-4 p-4 sm:p-5 text-surface-600 border-t md:border-t-0 md:border-l border-black/[0.06] leading-relaxed font-sans flex flex-col md:flex-row md:items-center">
                  <span className="md:hidden text-[10px] font-mono font-bold text-surface-400 uppercase tracking-wider mb-1">
                    Traditional Web:
                  </span>
                  <span>{row.traditional}</span>
                </div>

                {/* AgentBridge Side */}
                <div className="md:col-span-4 p-4 sm:p-5 text-surface-900 font-medium bg-brand-50/20 border-t md:border-t-0 md:border-l border-black/[0.06] leading-relaxed font-sans flex flex-col md:flex-row md:items-start gap-1 md:gap-2.5">
                  <span className="md:hidden text-[10px] font-mono font-bold text-brand-600 uppercase tracking-wider mb-1">
                    AgentBridge:
                  </span>
                  <div className="flex items-start gap-2">
                    <CheckCircle2 className="w-4 h-4 text-emerald-600 shrink-0 mt-0.5" />
                    <span>{row.agentbridge}</span>
                  </div>
                </div>
              </div>
            ))}
          </div>
        </div>
      </div>
    </section>
  )
}
